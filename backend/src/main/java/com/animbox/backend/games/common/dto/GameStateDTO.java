package com.animbox.backend.games.common.dto;

import com.animbox.backend.games.common.model.GameSession;
import com.animbox.backend.games.common.model.SessionStatus;
import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;

import java.util.List;
import java.util.Set;

/**
 * État complet de la partie, broadcasté vers /topic/session/{sessionId}
 * après chaque action. Le frontend affiche ou cache les réponses
 * selon revealedAnswerIds.
 */
public record GameStateDTO(
        Long sessionId,
        SessionStatus status,
        int currentQuestionIndex,
        int totalQuestions,
        String teamAName,
        String teamBName,
        int teamAScore,
        int teamBScore,
        Set<Long> revealedAnswerIds,
        QuestionDTO currentQuestion
) {

    public record QuestionDTO(
            Long id,
            String text,
            List<AnswerDTO> answers
    ) {}

    public record AnswerDTO(
            Long id,
            String text,
            int rank,
            int score
    ) {}

    public static GameStateDTO from(GameSession session) {
        List<FamilyFeudQuestion> questions = session.getGameSet().getQuestions();
        int idx = session.getCurrentQuestionIndex();

        QuestionDTO currentQuestion = null;
        if (idx < questions.size()) {
            FamilyFeudQuestion q = questions.get(idx);
            List<AnswerDTO> answers = q.getAnswers().stream()
                    .map(a -> new AnswerDTO(a.getId(), a.getText(), a.getRank(), a.getScore()))
                    .toList();
            currentQuestion = new QuestionDTO(q.getId(), q.getText(), answers);
        }

        return new GameStateDTO(
                session.getId(),
                session.getStatus(),
                idx,
                questions.size(),
                session.getTeamAName(),
                session.getTeamBName(),
                session.getTeamAScore(),
                session.getTeamBScore(),
                session.getRevealedAnswerIds(),
                currentQuestion
        );
    }
}
