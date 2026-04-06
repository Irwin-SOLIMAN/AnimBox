package com.animbox.backend.games.familyfeud.service;

import com.animbox.backend.games.common.dto.ActionDTO;
import com.animbox.backend.games.common.dto.GameStateDTO;
import com.animbox.backend.games.common.model.GameSession;
import com.animbox.backend.games.common.repository.GameSessionRepository;
import com.animbox.backend.games.familyfeud.model.FamilyFeudAnswer;
import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@Transactional
public class FamilyFeudGameService {

    private final GameSessionRepository sessionRepository;

    public FamilyFeudGameService(GameSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Dispatche les actions spécifiques Famille en Or.
     */
    public GameStateDTO applyAction(Long sessionId, ActionDTO action) {
        GameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("GameSession introuvable : " + sessionId));

        return switch (action.type()) {
            case FAULT -> addFault(session);
            case STEAL -> steal(session, action.answerId());
            case END_ROUND -> endRound(session, action.teamA());
            case SET_MULTIPLIER -> setMultiplier(session, action.points());
            default -> throw new IllegalArgumentException("Action non gérée par FamilyFeudGameService : " + action.type());
        };
    }

    /**
     * Ajoute une faute à l'équipe qui joue.
     * À 3 fautes, déclenche la phase de vol pour l'équipe adverse.
     */
    private GameStateDTO addFault(GameSession session) {
        session.addFault();
        return GameStateDTO.from(session);
    }

    /**
     * Tentative de vol par l'équipe adverse.
     * - Réponse valide (non révélée dans la question courante) :
     *     l'équipe adverse remporte tous les points du tour.
     * - Réponse invalide :
     *     l'équipe qui jouait remporte tous les points du tour.
     * Le tour est ensuite réinitialisé dans les deux cas.
     */
    private GameStateDTO steal(GameSession session, Long answerId) {
        FamilyFeudQuestion currentQuestion = getCurrentQuestion(session);

        boolean isValidSteal = currentQuestion.getAnswers().stream()
                .anyMatch(a -> a.getId().equals(answerId)
                        && !session.getRevealedAnswerIds().contains(a.getId()));

        if (isValidSteal) {
            // Révéler la réponse AVANT de calculer les points
            // pour que son score soit inclus dans le total du tour
            session.revealAnswer(answerId);
        }

        int points = computeRoundPoints(session, currentQuestion) * session.getRoundMultiplier();

        if (isValidSteal) {
            // L'équipe adverse (pas teamAPlaying) remporte TOUS les points du tour
            // (ceux révélés par A + la réponse volée par B), avec multiplicateur
            session.addScore(!session.isTeamAPlaying(), points);
        } else {
            // Mauvaise réponse : l'équipe qui jouait conserve les points déjà accumulés
            session.addScore(session.isTeamAPlaying(), points);
        }

        session.resetRound();
        return GameStateDTO.from(session);
    }

    /**
     * Fin normale du tour (toutes les réponses révélées, ou choix de l'animateur).
     * L'équipe spécifiée par teamA remporte les points accumulés.
     */
    private GameStateDTO endRound(GameSession session, Boolean teamA) {
        if (teamA == null) throw new IllegalArgumentException("teamA requis pour END_ROUND");

        FamilyFeudQuestion currentQuestion = getCurrentQuestion(session);
        int points = computeRoundPoints(session, currentQuestion) * session.getRoundMultiplier();

        session.addScore(teamA, points);
        session.resetRound();
        return GameStateDTO.from(session);
    }

    /**
     * Définit le multiplicateur de la manche (1, 2 ou 3).
     * Seulement si aucune réponse n'a encore été révélée pour la question courante.
     */
    private GameStateDTO setMultiplier(GameSession session, Integer multiplier) {
        if (multiplier == null) throw new IllegalArgumentException("points requis pour SET_MULTIPLIER");
        session.setMultiplier(multiplier);
        return GameStateDTO.from(session);
    }

    // --- Helpers ---

    private FamilyFeudQuestion getCurrentQuestion(GameSession session) {
        int idx = session.getCurrentQuestionIndex();
        var questions = session.getGameSet().getQuestions();
        if (idx >= questions.size()) {
            throw new IllegalStateException("Plus de question disponible à l'index " + idx);
        }
        return questions.get(idx);
    }

    private int computeRoundPoints(GameSession session, FamilyFeudQuestion question) {
        return question.getAnswers().stream()
                .filter(a -> session.getRevealedAnswerIds().contains(a.getId()))
                .mapToInt(FamilyFeudAnswer::getScore)
                .sum();
    }
}
