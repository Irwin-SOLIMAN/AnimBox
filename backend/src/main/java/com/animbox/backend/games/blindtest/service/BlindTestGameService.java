package com.animbox.backend.games.blindtest.service;

import com.animbox.backend.games.blindtest.dto.BlindTestStateDTO;
import com.animbox.backend.games.blindtest.dto.BlindTestTrackDTO;
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

    private record SessionState(boolean playing, String handState, boolean trackRevealed) {
        static SessionState initial() { return new SessionState(false, "NONE", false); }
        SessionState withPlaying(boolean p) { return new SessionState(p, handState, trackRevealed); }
        SessionState withHand(String h) { return new SessionState(playing, h, trackRevealed); }
        SessionState withRevealed(boolean r) { return new SessionState(playing, handState, r); }
        SessionState reset() { return new SessionState(false, "NONE", false); }
    }

    private final ConcurrentHashMap<Long, SessionState> states = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, List<BlindTestTrackDTO>> trackCache = new ConcurrentHashMap<>();

    private final GameSessionRepository sessionRepository;
    private final BlindTestTrackRepository trackRepository;
    private final DeezerService deezerService;

    public BlindTestGameService(GameSessionRepository sessionRepository,
                                 BlindTestTrackRepository trackRepository,
                                 DeezerService deezerService) {
        this.sessionRepository = sessionRepository;
        this.trackRepository = trackRepository;
        this.deezerService = deezerService;
    }

    @Transactional
    public BlindTestStateDTO applyAction(Long sessionId, ActionDTO action) {
        GameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Session introuvable: " + sessionId));

        SessionState state = states.getOrDefault(sessionId, SessionState.initial());
        List<BlindTestTrackDTO> tracks = getTracks(sessionId, session);

        state = switch (action.type()) {
            case START -> { session.start(); yield state; }
            case PLAY -> state.withPlaying(true);
            case PAUSE -> state.withPlaying(false);
            case NEXT_TRACK -> {
                if (session.getCurrentQuestionIndex() < tracks.size() - 1) {
                    session.nextQuestion();
                }
                yield state.reset();
            }
            case RAISE_HAND -> state.withHand(Boolean.TRUE.equals(action.teamA()) ? "A" : "B");
            case LOWER_HAND -> state.withHand("NONE");
            case AWARD_CORRECT -> {
                String team = state.handState();
                int points = tracks.isEmpty() ? 1 :
                        tracks.get(session.getCurrentQuestionIndex()).pointsValue();
                session.addScore("A".equals(team), points);
                yield state.withRevealed(true).withHand("NONE");
            }
            case AWARD_WRONG -> state.withHand("NONE");
            case FINISH -> { session.finish(); yield state.withPlaying(false); }
            default -> state;
        };

        states.put(sessionId, state);
        return buildDTO(session, tracks, state);
    }

    @Transactional(readOnly = true)
    public BlindTestStateDTO getState(Long sessionId) {
        GameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Session introuvable: " + sessionId));
        List<BlindTestTrackDTO> tracks = getTracks(sessionId, session);
        SessionState state = states.getOrDefault(sessionId, SessionState.initial());
        return buildDTO(session, tracks, state);
    }

    @Transactional(readOnly = true)
    public BlindTestStateDTO getStateByToken(String token) {
        GameSession session = sessionRepository.findByToken(token)
                .orElseThrow(() -> new NoSuchElementException("Session introuvable: " + token));
        List<BlindTestTrackDTO> tracks = getTracks(session.getId(), session);
        SessionState state = states.getOrDefault(session.getId(), SessionState.initial());
        return buildDTO(session, tracks, state);
    }

    private List<BlindTestTrackDTO> getTracks(Long sessionId, GameSession session) {
        return trackCache.computeIfAbsent(sessionId, id ->
                trackRepository.findByGameSet_IdOrderByPosition(session.getGameSet().getId())
                        .stream().map(BlindTestTrackDTO::from).toList()
        );
    }

    private BlindTestStateDTO buildDTO(GameSession session, List<BlindTestTrackDTO> tracks, SessionState state) {
        int idx = session.getCurrentQuestionIndex();
        String previewUrl = null;
        if (idx < tracks.size()) {
            Long deezerTrackId = tracks.get(idx).deezerTrackId();
            previewUrl = deezerService.getPreviewUrl(deezerTrackId).orElse(null);
        }
        return BlindTestStateDTO.from(session, tracks, state.playing(), state.handState(), state.trackRevealed(), previewUrl);
    }

    public void clearCache(Long sessionId) {
        states.remove(sessionId);
        trackCache.remove(sessionId);
    }
}
