package com.animbox.backend.games.blindtest.dto;

public record BlindTestTrackRequest(
        String title,
        String artist,
        Long deezerTrackId,
        int pointsValue
) {}
