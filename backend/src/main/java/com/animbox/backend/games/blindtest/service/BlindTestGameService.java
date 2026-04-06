package com.animbox.backend.games.blindtest.service;

import com.animbox.backend.games.blindtest.dto.BlindTestStateDTO;
import com.animbox.backend.games.blindtest.dto.BlindTestTeamDTO;
import com.animbox.backend.games.blindtest.dto.BlindTestTrackDTO;
import com.animbox.backend.games.blindtest.model.BlindTestTeam;
import com.animbox.backend.games.blindtest.repository.BlindTestTeamRepository;
import com.animbox.backend.games.blindtest.repository.BlindTestTrackRepository;
import com.animbox.backend.games.common.dto.ActionDTO;
import com.animbox.backend.games.common.model.GameSession;
import com.animbox.backend.games.common.repository.GameSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BlindTestGameService {

    /** État transient par session (playing, raisedTeamId, trackRevealed). */
    private record SessionState(boolean playing, Long raisedTeamId, boolean trackRevealed) {
        static SessionState initial() { return new SessionState(false, null, false); }
        SessionState withPlaying(boolean p)    { return new SessionState(p, raisedTeamId, trackRevealed); }
        SessionState withRaisedTeam(Long id)   { return new SessionState(playing, id, trackRevealed); }
        SessionState withRevealed(boolean r)   { return new SessionState(playing, raisedTeamId, r); }
        SessionState reset()                   { return new SessionState(false, null, false); }
    }

    private final ConcurrentHashMap<Long, SessionState>           states     = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, List<BlindTestTrackDTO>> trackCache = new ConcurrentHashMap<>();

    private final GameSessionRepository     sessionRepository;
    private final BlindTestTrackRepository  trackRepository;
    private final BlindTestTeamRepository   teamRepository;
    private final DeezerService             deezerService;

    public BlindTestGameService(GameSessionRepository sessionRepository,
                                 BlindTestTrackRepository trackRepository,
                                 BlindTestTeamRepository teamRepository,
                                 DeezerService deezerService) {
        this.sessionRepository = sessionRepository;
        this.trackRepository   = trackRepository;
        this.teamRepository    = teamRepository;
        this.deezerService     = deezerService;
    }

    @Transactional
    public BlindTestStateDTO applyAction(Long sessionId, ActionDTO action) {
        GameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Session introuvable: " + sessionId));

        SessionState state  = states.getOrDefault(sessionId, SessionState.initial());
        List<BlindTestTrackDTO> tracks = getTracks(sessionId, session);

        state = switch (action.type()) {
            case START  -> { session.start(); yield state; }
            case PLAY   -> state.withPlaying(true);
            case PAUSE  -> state.withPlaying(false);

            case NEXT_TRACK -> {
                if (session.getCurrentQuestionIndex() < tracks.size() - 1) session.nextQuestion();
                yield state.reset();
            }

            case RAISE_HAND -> state.withRaisedTeam(action.teamId());
            case LOWER_HAND -> state.withRaisedTeam(null);

            case AWARD_CORRECT -> {
                Long teamId = state.raisedTeamId();
                if (teamId != null) {
                    int pts = tracks.isEmpty() ? 1
                            : tracks.get(session.getCurrentQuestionIndex()).pointsValue();
                    BlindTestTeam team = teamRepository.findById(teamId)
                            .orElseThrow(() -> new NoSuchElementException("Team introuvable: " + teamId));
                    team.addScore(pts);
                    teamRepository.save(team);
                }
                yield state.withRaisedTeam(null).withRevealed(true);
            }

            case AWARD_WRONG -> state.withRaisedTeam(null);

            case ADJUST_SCORE -> {
                Long teamId = action.teamId();
                Integer delta = action.points();
                if (teamId != null && delta != null) {
                    BlindTestTeam team = teamRepository.findById(teamId)
                            .orElseThrow(() -> new NoSuchElementException("Team introuvable: " + teamId));
                    int newScore = Math.max(0, team.getScore() + delta);
                    team.setScore(newScore);
                    teamRepository.save(team);
                }
                yield state;
            }

            case FINISH      -> { session.finish(); yield state.withPlaying(false); }
            default          -> state;
        };

        states.put(sessionId, state);
        return buildDTO(session, tracks, state);
    }

    @Transactional(readOnly = true)
    public BlindTestStateDTO getState(Long sessionId) {
        GameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Session introuvable: " + sessionId));
        return buildDTO(session, getTracks(sessionId, session),
                states.getOrDefault(sessionId, SessionState.initial()));
    }

    @Transactional(readOnly = true)
    public BlindTestStateDTO getStateByToken(String token) {
        GameSession session = sessionRepository.findByToken(token)
                .orElseThrow(() -> new NoSuchElementException("Session introuvable: " + token));
        return buildDTO(session, getTracks(session.getId(), session),
                states.getOrDefault(session.getId(), SessionState.initial()));
    }

    private List<BlindTestTrackDTO> getTracks(Long sessionId, GameSession session) {
        return trackCache.computeIfAbsent(sessionId, id ->
                trackRepository.findByGameSet_IdOrderByPosition(session.getGameSet().getId())
                        .stream().map(BlindTestTrackDTO::from).toList()
        );
    }

    private List<BlindTestTeamDTO> loadTeams(Long sessionId) {
        return teamRepository.findBySession_IdOrderByPosition(sessionId)
                .stream().map(BlindTestTeamDTO::from).toList();
    }

    private BlindTestStateDTO buildDTO(GameSession session, List<BlindTestTrackDTO> tracks, SessionState state) {
        int idx = session.getCurrentQuestionIndex();
        String previewUrl = null;
        if (idx < tracks.size()) {
            previewUrl = deezerService.getPreviewUrl(tracks.get(idx).deezerTrackId()).orElse(null);
        }
        return BlindTestStateDTO.from(
                session, tracks, loadTeams(session.getId()),
                state.playing(), state.raisedTeamId(), state.trackRevealed(), previewUrl
        );
    }

    public void clearCache(Long sessionId) {
        states.remove(sessionId);
        trackCache.remove(sessionId);
    }
}
