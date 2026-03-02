package com.animbox.backend.games.common.dto;

import com.animbox.backend.games.common.model.GameSet;
import com.animbox.backend.games.familyfeud.dto.FamilyFeudQuestionResponse;

import java.time.LocalDateTime;
import java.util.List;

public record GameSetResponse(
        Long id,
        String name,
        GameTypeResponse gameType,
        List<FamilyFeudQuestionResponse> questions,
        LocalDateTime createdAt
) {
    public static GameSetResponse from(GameSet gameSet) {
        return new GameSetResponse(
                gameSet.getId(),
                gameSet.getName(),
                GameTypeResponse.from(gameSet.getGameType()),
                gameSet.getQuestions().stream().map(FamilyFeudQuestionResponse::from).toList(),
                gameSet.getCreatedAt()
        );
    }
}
