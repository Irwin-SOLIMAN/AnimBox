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
        Long raisedTeamId,     // null si personne n'a levé la main
        boolean trackRevealed,
        List<BlindTestTeamDTO> teams,
        BlindTestTrackDTO currentTrack,
        String previewUrl
) {
    public static BlindTestStateDTO from(GameSession session,
                                         List<BlindTestTrackDTO> tracks,
                                         List<BlindTestTeamDTO> teams,
                                         boolean playing,
                                         Long raisedTeamId,
                                         boolean trackRevealed,
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
                raisedTeamId,
                trackRevealed,
                teams,
                current,
                previewUrl
        );
    }
}
