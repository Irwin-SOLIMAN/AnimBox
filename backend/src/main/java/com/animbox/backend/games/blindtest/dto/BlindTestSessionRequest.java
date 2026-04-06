package com.animbox.backend.games.blindtest.dto;

import java.util.List;

public record BlindTestSessionRequest(Long gameSetId, List<String> teamNames) {}
