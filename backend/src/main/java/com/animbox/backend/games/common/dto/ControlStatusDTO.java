package com.animbox.backend.games.common.dto;

/**
 * Réponse broadcast sur /topic/session/{sessionId}/control-status.
 * type     = "CONTROL_CLAIMED" ou "CONTROL_TAKEN"
 * clientId = UUID du client qui a envoyé le claim (permet de filtrer côté frontend)
 */
public record ControlStatusDTO(String type, String clientId) {}
