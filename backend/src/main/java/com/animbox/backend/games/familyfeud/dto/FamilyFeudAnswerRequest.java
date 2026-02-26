package com.animbox.backend.games.familyfeud.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record FamilyFeudAnswerRequest(

        @NotBlank(message = "Le texte de la réponse est requis")
        String text,

        @Min(value = 1, message = "Le rang minimum est 1")
        @Max(value = 8, message = "Le rang maximum est 8")
        int rank,

        @Positive(message = "Le score doit être positif")
        int score
) {}
