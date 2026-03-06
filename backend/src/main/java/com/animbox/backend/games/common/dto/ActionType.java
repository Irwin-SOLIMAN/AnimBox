package com.animbox.backend.games.common.dto;

public enum ActionType {
    START,
    NEXT_QUESTION,
    REVEAL_ANSWER,  // payload: answerId
    ADD_SCORE,      // payload: teamA + points
    FINISH
}
