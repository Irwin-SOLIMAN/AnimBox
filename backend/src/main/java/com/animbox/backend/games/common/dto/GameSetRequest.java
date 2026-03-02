package com.animbox.backend.games.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record GameSetRequest(

        @NotBlank(message = "Le nom du set est requis")
        String name,

        @NotNull(message = "Le type de jeu est requis")
        Long gameTypeId,

        // Liste ordonnée des IDs de questions — l'ordre ici = ordre en jeu
        @NotEmpty(message = "Le set doit contenir au moins une question")
        List<Long> questionIds
) {}
