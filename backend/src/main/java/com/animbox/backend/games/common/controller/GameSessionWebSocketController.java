package com.animbox.backend.games.common.controller;

import com.animbox.backend.games.common.dto.ActionDTO;
import com.animbox.backend.games.common.dto.GameStateDTO;
import com.animbox.backend.games.common.service.GameSessionService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameSessionWebSocketController {

    private final GameSessionService sessionService;
    private final SimpMessagingTemplate messagingTemplate;

    public GameSessionWebSocketController(GameSessionService sessionService,
                                           SimpMessagingTemplate messagingTemplate) {
        this.sessionService = sessionService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Reçoit une action de l'animateur et broadcast le nouvel état à tous les abonnés.
     *
     * L'animateur envoie vers : /app/session/{sessionId}/action
     * Tous les abonnés reçoivent sur : /topic/session/{sessionId}
     */
    @MessageMapping("/session/{sessionId}/action")
    public void handleAction(@DestinationVariable Long sessionId, ActionDTO action) {
        GameStateDTO state = sessionService.applyAction(sessionId, action);
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, state);
    }
}
