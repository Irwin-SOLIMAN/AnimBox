package com.animbox.backend.games.common.dto;

/**
 * Réponse envoyée en privé au client qui tente de prendre le contrôle d'une session.
 * type = "CONTROL_CLAIMED" → le client est le commandant
 * type = "CONTROL_TAKEN"   → un autre appareil contrôle déjà la session
 */
public record ControlStatusDTO(String type) {}
