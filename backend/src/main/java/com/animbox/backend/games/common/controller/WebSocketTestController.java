package com.animbox.backend.games.common.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * Controller de test WebSocket.
 * Le client envoie un message à /app/ping
 * Le serveur répond à tous les abonnés de /topic/pong
 *
 * Pour tester dans la console du navigateur :
 *   const socket = new SockJS('http://localhost:8080/ws');
 *   const client = Stomp.over(socket);
 *   client.connect({}, () => {
 *     client.subscribe('/topic/pong', (msg) => console.log(msg.body));
 *     client.send('/app/ping', {}, 'hello');
 *   });
 */
@Controller
public class WebSocketTestController {

    @MessageMapping("/ping")
    @SendTo("/topic/pong")
    public String ping(String message) {
        return "pong: " + message;
    }
}
