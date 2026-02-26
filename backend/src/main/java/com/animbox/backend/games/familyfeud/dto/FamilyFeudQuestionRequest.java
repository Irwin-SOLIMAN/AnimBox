package com.animbox.backend.games.familyfeud.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FamilyFeudQuestionRequest(

        @NotBlank(message = "Le texte de la question est requis")
        String text,

        String category,

        @NotEmpty(message = "La question doit avoir au moins une réponse")
        @Size(min = 2, max = 8, message = "Une question doit avoir entre 2 et 8 réponses")
        List<@Valid FamilyFeudAnswerRequest> answers
) {}
