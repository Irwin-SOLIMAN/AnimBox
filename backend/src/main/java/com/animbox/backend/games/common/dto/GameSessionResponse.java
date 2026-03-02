package com.animbox.backend.games.common.dto;

import com.animbox.backend.games.common.model.GameSession;
import com.animbox.backend.games.common.model.SessionStatus;

import java.time.LocalDateTime;
import java.util.Set;

public record GameSessionResponse(
        Long id,
        GameSetResponse gameSet,
        SessionStatus status,
        int currentQuestionIndex,
        String teamAName,
        String teamBName,
        int teamAScore,
        int teamBScore,
        Set<Long> revealedAnswerIds,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        LocalDateTime createdAt
) {
    public static GameSessionResponse from(GameSession session) {
        return new GameSessionResponse(
                session.getId(),
                GameSetResponse.from(session.getGameSet()),
                session.getStatus(),
                session.getCurrentQuestionIndex(),
                session.getTeamAName(),
                session.getTeamBName(),
                session.getTeamAScore(),
                session.getTeamBScore(),
                session.getRevealedAnswerIds(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getCreatedAt()
        );
    }
}
