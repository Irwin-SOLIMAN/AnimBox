package com.animbox.backend.games.blindtest.dto;

import com.animbox.backend.games.common.model.GameSession;

import java.time.LocalDateTime;
import java.util.List;

public record BlindTestSessionDTO(
        Long id,
        String token,
        String status,
        String gameSetName,
        List<BlindTestTeamDTO> teams,
        LocalDateTime createdAt
) {
    public static BlindTestSessionDTO from(GameSession session, List<BlindTestTeamDTO> teams) {
        return new BlindTestSessionDTO(
                session.getId(),
                session.getToken(),
                session.getStatus().name(),
                session.getGameSet().getName(),
                teams,
                session.getCreatedAt()
        );
    }
}
