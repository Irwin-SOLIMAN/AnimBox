package com.animbox.backend.games.common.dto;

/**
 * Message envoyé par l'animateur via WebSocket.
 * Chemin : /app/session/{sessionId}/action
 *
 * Exemples :
 *   { "type": "START" }
 *   { "type": "REVEAL_ANSWER", "answerId": 7 }
 *   { "type": "ADD_SCORE", "teamA": true, "points": 30 }
 *   { "type": "NEXT_QUESTION" }
 *   { "type": "FINISH" }
 */
public record ActionDTO(
        ActionType type,
        Long answerId,    // REVEAL_ANSWER
        Boolean teamA,    // ADD_SCORE — true = équipe A, false = équipe B
        Integer points    // ADD_SCORE
) {}
