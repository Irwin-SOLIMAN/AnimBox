package com.animbox.backend.games.common.service;

import com.animbox.backend.auth.model.User;
import com.animbox.backend.auth.repository.UserRepository;
import com.animbox.backend.games.common.dto.ActionDTO;
import com.animbox.backend.games.common.dto.GameSessionRequest;
import com.animbox.backend.games.common.dto.GameSessionResponse;
import com.animbox.backend.games.common.dto.GameStateDTO;
import com.animbox.backend.games.common.model.GameSession;
import com.animbox.backend.games.common.model.GameSet;
import com.animbox.backend.games.common.repository.GameSessionRepository;
import com.animbox.backend.games.common.repository.GameSetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class GameSessionService {

    private final GameSessionRepository sessionRepository;
    private final GameSetRepository gameSetRepository;
    private final UserRepository userRepository;

    public GameSessionService(GameSessionRepository sessionRepository,
                               GameSetRepository gameSetRepository,
                               UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.gameSetRepository = gameSetRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<GameSessionResponse> findAllForUser(String email) {
        return sessionRepository.findByHostEmail(email)
                .stream()
                .map(GameSessionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public GameSessionResponse findById(Long id, String email) {
        return GameSessionResponse.from(getOwnedSession(id, email));
    }

    public GameSessionResponse create(GameSessionRequest request, String email) {
        User host = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable"));

        // L'animateur peut utiliser ses propres GameSets ou les GameSets publics (presets)
        GameSet gameSet = gameSetRepository.findByIdForUser(request.gameSetId(), email)
                .orElseThrow(() -> new NoSuchElementException("GameSet introuvable : " + request.gameSetId()));

        GameSession session = new GameSession(gameSet, host, request.teamAName(), request.teamBName());
        return GameSessionResponse.from(sessionRepository.save(session));
    }

    public GameSessionResponse start(Long id, String email) {
        GameSession session = getOwnedSession(id, email);
        session.start();
        return GameSessionResponse.from(session);
    }

    public GameSessionResponse finish(Long id, String email) {
        GameSession session = getOwnedSession(id, email);
        session.finish();
        return GameSessionResponse.from(session);
    }

    public void delete(Long id, String email) {
        sessionRepository.delete(getOwnedSession(id, email));
    }

    @Transactional(readOnly = true)
    public GameStateDTO getState(Long id) {
        return GameStateDTO.from(
                sessionRepository.findById(id)
                        .orElseThrow(() -> new NoSuchElementException("GameSession introuvable : " + id))
        );
    }

    @Transactional(readOnly = true)
    public GameStateDTO getStateByToken(String token) {
        return GameStateDTO.from(
                sessionRepository.findByToken(token)
                        .orElseThrow(() -> new NoSuchElementException("GameSession introuvable : " + token))
        );
    }

    public GameStateDTO applyAction(Long id, ActionDTO action) {
        GameSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("GameSession introuvable : " + id));

        switch (action.type()) {
            case START -> session.start();
            case NEXT_QUESTION -> {
                session.nextQuestion();
                // Après changement de question, l'équipe qui joue reste inchangée
                // (l'animateur peut utiliser SET_TEAM pour choisir qui commence)
            }
            case REVEAL_ANSWER -> session.revealAnswer(action.answerId());
            case ADD_SCORE -> session.addScore(action.teamA(), action.points());
            case FINISH -> session.finish();
            case SET_TEAM -> {
                if (action.teamA() == null) throw new IllegalArgumentException("teamA requis pour SET_TEAM");
                session.setTeamPlaying(action.teamA());
            }
        }

        return GameStateDTO.from(session);
    }

    private GameSession getOwnedSession(Long id, String email) {
        return sessionRepository.findByIdAndHostEmail(id, email)
                .orElseThrow(() -> new NoSuchElementException("GameSession introuvable : " + id));
    }
}
