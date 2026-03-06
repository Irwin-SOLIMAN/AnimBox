package com.animbox.backend.games.common.controller;

import com.animbox.backend.games.common.dto.ActionDTO;
import com.animbox.backend.games.common.dto.ActionType;
import com.animbox.backend.games.common.dto.GameStateDTO;
import com.animbox.backend.games.common.service.GameSessionService;
import com.animbox.backend.games.familyfeud.service.FamilyFeudGameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Set;

@Controller
public class GameSessionWebSocketController {

    private static final Set<ActionType> FAMILY_FEUD_ACTIONS = Set.of(
            ActionType.FAULT, ActionType.STEAL, ActionType.END_ROUND
    );

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
     * Reçoit une action de l'animateur et broadcast le nouvel état à tous les abonnés.
     *
     * L'animateur envoie vers : /app/session/{sessionId}/action
     * Tous les abonnés reçoivent sur  : /topic/session/{sessionId}
     */
    @MessageMapping("/session/{sessionId}/action")
    public void handleAction(@DestinationVariable Long sessionId, ActionDTO action) {
        GameStateDTO state = FAMILY_FEUD_ACTIONS.contains(action.type())
                ? familyFeudGameService.applyAction(sessionId, action)
                : sessionService.applyAction(sessionId, action);

        messagingTemplate.convertAndSend("/topic/session/" + sessionId, state);
    }
}
