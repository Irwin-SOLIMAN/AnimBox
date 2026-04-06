package com.animbox.backend.games.blindtest.dto;

import com.animbox.backend.games.blindtest.model.BlindTestTeam;

public record BlindTestTeamDTO(Long id, String name, int score, int position) {
    public static BlindTestTeamDTO from(BlindTestTeam t) {
        return new BlindTestTeamDTO(t.getId(), t.getName(), t.getScore(), t.getPosition());
    }
}
