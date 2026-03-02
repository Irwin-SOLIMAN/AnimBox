package com.animbox.backend.games.common.controller;

import com.animbox.backend.games.common.dto.GameSetRequest;
import com.animbox.backend.games.common.dto.GameSetResponse;
import com.animbox.backend.games.common.service.GameSetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game-sets")
public class GameSetController {

    private final GameSetService gameSetService;

    public GameSetController(GameSetService gameSetService) {
        this.gameSetService = gameSetService;
    }

    @GetMapping
    public ResponseEntity<List<GameSetResponse>> findAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(gameSetService.findAllForUser(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameSetResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(gameSetService.findById(id, userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<GameSetResponse> create(
            @Valid @RequestBody GameSetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gameSetService.create(request, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GameSetResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody GameSetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(gameSetService.update(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        gameSetService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
