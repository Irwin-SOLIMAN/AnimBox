package com.animbox.backend.games.common.controller;

import com.animbox.backend.games.common.dto.GameSessionRequest;
import com.animbox.backend.games.common.dto.GameSessionResponse;
import com.animbox.backend.games.common.dto.GameStateDTO;
import com.animbox.backend.games.common.service.GameSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game-sessions")
public class GameSessionController {

    private final GameSessionService sessionService;

    public GameSessionController(GameSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    public ResponseEntity<List<GameSessionResponse>> findAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.findAllForUser(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameSessionResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.findById(id, userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<GameSessionResponse> create(
            @Valid @RequestBody GameSessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.create(request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<GameSessionResponse> start(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.start(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<GameSessionResponse> finish(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.finish(id, userDetails.getUsername()));
    }

    // Appelé à la reconnexion pour récupérer l'état courant avant de s'abonner au WebSocket
    @GetMapping("/{id}/state")
    public ResponseEntity<GameStateDTO> getState(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getState(id));
    }

    // Endpoint public — accès par token opaque (pour l'écran TV et la télécommande)
    @GetMapping("/by-token/{token}/state")
    public ResponseEntity<GameStateDTO> getStateByToken(@PathVariable String token) {
        return ResponseEntity.ok(sessionService.getStateByToken(token));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        sessionService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
