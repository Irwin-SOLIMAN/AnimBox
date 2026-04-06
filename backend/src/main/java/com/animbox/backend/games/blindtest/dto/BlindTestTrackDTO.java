package com.animbox.backend.games.blindtest.dto;

import com.animbox.backend.games.blindtest.model.BlindTestTrack;

public record BlindTestTrackDTO(
        Long id,
        String title,
        String artist,
        Long deezerTrackId,
        int pointsValue
) {
    public static BlindTestTrackDTO from(BlindTestTrack t) {
        return new BlindTestTrackDTO(t.getId(), t.getTitle(), t.getArtist(), t.getDeezerTrackId(), t.getPointsValue());
    }
}
