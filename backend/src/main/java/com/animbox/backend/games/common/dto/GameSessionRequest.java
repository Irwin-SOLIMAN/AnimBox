package com.animbox.backend.games.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GameSessionRequest(

        @NotNull(message = "Le GameSet est requis")
        Long gameSetId,

        @NotBlank(message = "Le nom de l'équipe A est requis")
        String teamAName,

        @NotBlank(message = "Le nom de l'équipe B est requis")
        String teamBName
) {}
