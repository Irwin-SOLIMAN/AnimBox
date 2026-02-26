package com.animbox.backend.games.common.dto;

import com.animbox.backend.games.common.model.GameType;

public record GameTypeResponse(
        Long id,
        String code,
        String name,
        String description,
        int maxPlayers
) {
    public static GameTypeResponse from(GameType gameType) {
        return new GameTypeResponse(
                gameType.getId(),
                gameType.getCode(),
                gameType.getName(),
                gameType.getDescription(),
                gameType.getMaxPlayers()
        );
    }
}
