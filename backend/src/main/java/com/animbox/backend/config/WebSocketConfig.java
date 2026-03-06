package com.animbox.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Point d'entrée WebSocket — le frontend se connecte à ws://host/ws
        // withSockJS() ajoute un fallback HTTP pour les navigateurs sans WebSocket natif
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic/** : broker interne, le backend y envoie des messages vers les clients abonnés
        registry.enableSimpleBroker("/topic");

        // /app/** : préfixe pour les messages envoyés par le client vers le backend (@MessageMapping)
        registry.setApplicationDestinationPrefixes("/app");
    }
}
