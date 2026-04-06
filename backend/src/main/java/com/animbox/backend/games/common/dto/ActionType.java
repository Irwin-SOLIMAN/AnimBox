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
    END_ROUND,      // fin du tour — payload: teamA (qui remporte les points)

    // Actions spécifiques Blind Test
    PLAY,           // démarrer/reprendre la musique
    PAUSE,          // mettre en pause
    NEXT_TRACK,     // piste suivante (réinitialise l'état du tour)
    RAISE_HAND,     // payload: teamA (true = équipe A, false = équipe B)
    LOWER_HAND,     // annuler la levée de main
    AWARD_CORRECT,  // bonne réponse → points attribués + piste révélée
    AWARD_WRONG,    // mauvaise réponse → annule la levée de main
    ADJUST_SCORE,   // Blind Test : ajustement direct des points — payload: teamId + points (peut être négatif)

    // Actions spécifiques Famille en Or — choix d'équipe et multiplicateur
    SET_TEAM,       // choisir l'équipe qui commence — payload: teamA (true = équipe A)
    SET_MULTIPLIER  // multiplicateur de la manche — payload: points (1, 2 ou 3)
}
