package com.animbox.backend.games.familyfeud.dto;

import com.animbox.backend.games.familyfeud.model.FamilyFeudAnswer;

public record FamilyFeudAnswerResponse(
        Long id,
        String text,
        int rank,
        int score
) {
    public static FamilyFeudAnswerResponse from(FamilyFeudAnswer answer) {
        return new FamilyFeudAnswerResponse(
                answer.getId(),
                answer.getText(),
                answer.getRank(),
                answer.getScore()
        );
    }
}
