package com.animbox.backend.games.blindtest.dto;

import com.animbox.backend.games.common.model.GameSession;

import java.util.List;

public record BlindTestStateDTO(
        Long sessionId,
        String token,
        String status,
        int currentTrackIndex,
        int totalTracks,
        boolean playing,
        String handState,      // "NONE", "A", "B"
        boolean trackRevealed,
        String teamAName,
        String teamBName,
        int teamAScore,
        int teamBScore,
        BlindTestTrackDTO currentTrack,
        String previewUrl      // fetched from Deezer, null if unavailable
) {
    public static BlindTestStateDTO from(GameSession session, List<BlindTestTrackDTO> tracks,
                                         boolean playing, String handState, boolean trackRevealed,
                                         String previewUrl) {
        int idx = session.getCurrentQuestionIndex();
        BlindTestTrackDTO current = (idx < tracks.size()) ? tracks.get(idx) : null;
        return new BlindTestStateDTO(
                session.getId(),
                session.getToken(),
                session.getStatus().name(),
                idx,
                tracks.size(),
                playing,
                handState,
                trackRevealed,
                session.getTeamAName(),
                session.getTeamBName(),
                session.getTeamAScore(),
                session.getTeamBScore(),
                current,
                previewUrl
        );
    }
}
