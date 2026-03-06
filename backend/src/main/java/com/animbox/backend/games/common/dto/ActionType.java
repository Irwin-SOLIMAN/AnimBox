package com.animbox.backend.games.common.dto;

public enum ActionType {
    // Actions génériques
    START,
    NEXT_QUESTION,
    REVEAL_ANSWER,  // payload: answerId
    ADD_SCORE,      // payload: teamA + points
    FINISH,

    // Actions spécifiques Famille en Or
    FAULT,          // une faute pour l'équipe qui joue
    STEAL,          // tentative de vol — payload: answerId
    END_ROUND       // fin du tour — payload: teamA (qui remporte les points)
}
