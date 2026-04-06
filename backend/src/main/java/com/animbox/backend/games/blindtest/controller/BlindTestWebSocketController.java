package com.animbox.backend.games.blindtest.controller;

import com.animbox.backend.games.blindtest.dto.BlindTestStateDTO;
import com.animbox.backend.games.blindtest.service.BlindTestGameService;
import com.animbox.backend.games.common.dto.ActionDTO;
import com.animbox.backend.games.common.dto.ControlStatusDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class BlindTestWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(BlindTestWebSocketController.class);

    private final ConcurrentHashMap<Long, String> controllers = new ConcurrentHashMap<>();
    private final BlindTestGameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    public BlindTestWebSocketController(BlindTestGameService gameService,
                                         SimpMessagingTemplate messagingTemplate) {
        this.gameService = gameService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/blind-test/{sessionId}/claim-control")
    public void handleClaimControl(@DestinationVariable Long sessionId,
                                    @Payload Map<String, String> body,
                                    SimpMessageHeaderAccessor headerAccessor) {
        String stompSessionId = headerAccessor.getSessionId();
        String clientId = body.getOrDefault("clientId", "");
        String existing = controllers.putIfAbsent(sessionId, stompSessionId);
        boolean claimed = existing == null || existing.equals(stompSessionId);
        log.info("[blind-test] claim-control sessionId={} claimed={}", sessionId, claimed);
        messagingTemplate.convertAndSend(
                "/topic/blind-test/" + sessionId + "/control-status",
                new ControlStatusDTO(claimed ? "CONTROL_CLAIMED" : "CONTROL_TAKEN", clientId)
        );
    }

    @MessageMapping("/blind-test/{sessionId}/action")
    public void handleAction(@DestinationVariable Long sessionId,
                              @Payload ActionDTO action,
                              SimpMessageHeaderAccessor headerAccessor) {
        String stompSessionId = headerAccessor.getSessionId();
        if (!stompSessionId.equals(controllers.get(sessionId))) return;

        BlindTestStateDTO state = gameService.applyAction(sessionId, action);
        messagingTemplate.convertAndSend("/topic/blind-test/" + sessionId, state);
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String stompSessionId = event.getSessionId();
        controllers.entrySet().removeIf(e -> stompSessionId.equals(e.getValue()));
    }
}
