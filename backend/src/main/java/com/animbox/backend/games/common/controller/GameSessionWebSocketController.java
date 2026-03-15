package com.animbox.backend.games.common.controller;

import com.animbox.backend.games.common.dto.ActionDTO;
import com.animbox.backend.games.common.dto.ActionType;
import com.animbox.backend.games.common.dto.ControlStatusDTO;
import com.animbox.backend.games.common.dto.GameStateDTO;
import com.animbox.backend.games.common.service.GameSessionService;
import com.animbox.backend.games.familyfeud.service.FamilyFeudGameService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class GameSessionWebSocketController {

    private static final Set<ActionType> FAMILY_FEUD_ACTIONS = Set.of(
            ActionType.FAULT, ActionType.STEAL, ActionType.END_ROUND
    );

    /** sessionId → stompSessionId du commandant actuel */
    private final ConcurrentHashMap<Long, String> controllers = new ConcurrentHashMap<>();

    private final GameSessionService sessionService;
    private final FamilyFeudGameService familyFeudGameService;
    private final SimpMessagingTemplate messagingTemplate;

    public GameSessionWebSocketController(GameSessionService sessionService,
                                           FamilyFeudGameService familyFeudGameService,
                                           SimpMessagingTemplate messagingTemplate) {
        this.sessionService = sessionService;
        this.familyFeudGameService = familyFeudGameService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Un client tente de prendre le contrôle exclusif d'une session.
     * Répond sur un topic session-specific pour éviter le routing user (pas de Principal).
     *
     * Client envoie vers : /app/session/{sessionId}/claim-control
     * Réponse sur : /topic/control-status/{stompSessionId}
     */
    @MessageMapping("/session/{sessionId}/claim-control")
    public void handleClaimControl(@DestinationVariable Long sessionId,
                                   SimpMessageHeaderAccessor headerAccessor) {
        String stompSessionId = headerAccessor.getSessionId();

        String existing = controllers.putIfAbsent(sessionId, stompSessionId);
        boolean claimed = existing == null || existing.equals(stompSessionId);

        ControlStatusDTO response = new ControlStatusDTO(claimed ? "CONTROL_CLAIMED" : "CONTROL_TAKEN");

        messagingTemplate.convertAndSend("/topic/control-status/" + stompSessionId, response);
    }

    /**
     * Libère le slot commandant si l'appareil qui se déconnecte était le commandant.
     */
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String stompSessionId = event.getSessionId();
        controllers.entrySet().removeIf(entry -> stompSessionId.equals(entry.getValue()));
    }

    /**
     * Reçoit une action de l'animateur et broadcast le nouvel état à tous les abonnés.
     *
     * L'animateur envoie vers : /app/session/{sessionId}/action
     * Tous les abonnés reçoivent sur  : /topic/session/{sessionId}
     */
    @MessageMapping("/session/{sessionId}/action")
    public void handleAction(@DestinationVariable Long sessionId, ActionDTO action,
                             SimpMessageHeaderAccessor headerAccessor) {
        String stompSessionId = headerAccessor.getSessionId();
        String commander = controllers.get(sessionId);

        // Ignorer l'action si l'expéditeur n'est pas le commandant
        if (!stompSessionId.equals(commander)) {
            return;
        }

        GameStateDTO state = FAMILY_FEUD_ACTIONS.contains(action.type())
                ? familyFeudGameService.applyAction(sessionId, action)
                : sessionService.applyAction(sessionId, action);

        messagingTemplate.convertAndSend("/topic/session/" + sessionId, state);
    }
}
