package com.animbox.backend.games.common.controller;

import com.animbox.backend.games.common.dto.GameTypeResponse;
import com.animbox.backend.games.common.service.GameTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game-types")
public class GameTypeController {

    private final GameTypeService gameTypeService;

    public GameTypeController(GameTypeService gameTypeService) {
        this.gameTypeService = gameTypeService;
    }

    @GetMapping
    public ResponseEntity<List<GameTypeResponse>> findAll() {
        return ResponseEntity.ok(gameTypeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameTypeResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(gameTypeService.findById(id));
    }
}
