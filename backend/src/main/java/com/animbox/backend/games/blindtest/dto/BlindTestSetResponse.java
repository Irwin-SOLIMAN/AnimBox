package com.animbox.backend.games.blindtest.dto;

import com.animbox.backend.games.common.model.GameSet;

import java.time.LocalDateTime;

public record BlindTestSetResponse(
        Long id,
        String name,
        LocalDateTime createdAt,
        boolean isPublic
) {
    public static BlindTestSetResponse from(GameSet gs) {
        return new BlindTestSetResponse(gs.getId(), gs.getName(), gs.getCreatedAt(), gs.isPublic());
    }
}
