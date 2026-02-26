package com.animbox.backend.games.familyfeud.dto;

import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;

import java.util.List;

public record FamilyFeudQuestionResponse(
        Long id,
        String text,
        String category,
        List<FamilyFeudAnswerResponse> answers
) {
    public static FamilyFeudQuestionResponse from(FamilyFeudQuestion question) {
        return new FamilyFeudQuestionResponse(
                question.getId(),
                question.getText(),
                question.getCategory(),
                question.getAnswers().stream().map(FamilyFeudAnswerResponse::from).toList()
        );
    }
}
