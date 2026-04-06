package com.animbox.backend.games.blindtest.controller;

import com.animbox.backend.games.blindtest.dto.*;
import com.animbox.backend.games.blindtest.model.BlindTestTrack;
import com.animbox.backend.games.blindtest.repository.BlindTestTrackRepository;
import com.animbox.backend.games.blindtest.service.BlindTestGameService;
import com.animbox.backend.games.blindtest.service.DeezerService;
import com.animbox.backend.auth.model.User;
import com.animbox.backend.auth.repository.UserRepository;
import com.animbox.backend.games.common.model.GameSet;
import com.animbox.backend.games.common.model.GameType;
import com.animbox.backend.games.common.repository.GameSetRepository;
import com.animbox.backend.games.common.repository.GameTypeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/blind-test")
public class BlindTestController {

    private final BlindTestTrackRepository trackRepository;
    private final GameSetRepository gameSetRepository;
    private final GameTypeRepository gameTypeRepository;
    private final UserRepository userRepository;
    private final DeezerService deezerService;
    private final BlindTestGameService gameService;

    public BlindTestController(BlindTestTrackRepository trackRepository,
                                GameSetRepository gameSetRepository,
                                GameTypeRepository gameTypeRepository,
                                UserRepository userRepository,
                                DeezerService deezerService,
                                BlindTestGameService gameService) {
        this.trackRepository = trackRepository;
        this.gameSetRepository = gameSetRepository;
        this.gameTypeRepository = gameTypeRepository;
        this.userRepository = userRepository;
        this.deezerService = deezerService;
        this.gameService = gameService;
    }

    // ── Sets ────────────────────────────────────────────────────────────────

    @GetMapping("/sets")
    public ResponseEntity<List<BlindTestSetResponse>> getSets(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<BlindTestSetResponse> sets = gameSetRepository
                .findAllForUser(userDetails.getUsername())
                .stream()
                .filter(gs -> "BLIND_TEST".equals(gs.getGameType().getCode()))
                .map(BlindTestSetResponse::from)
                .toList();
        return ResponseEntity.ok(sets);
    }

    @PostMapping("/sets")
    public ResponseEntity<BlindTestSetResponse> createSet(
            @RequestBody BlindTestSetNameRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        GameType type = gameTypeRepository.findByCode("BLIND_TEST")
                .orElseThrow(() -> new NoSuchElementException("GameType BLIND_TEST introuvable"));
        User owner = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable"));
        GameSet gs = gameSetRepository.save(new GameSet(req.name(), type, owner));
        return ResponseEntity.status(HttpStatus.CREATED).body(BlindTestSetResponse.from(gs));
    }

    @DeleteMapping("/sets/{setId}")
    public ResponseEntity<Void> deleteSet(
            @PathVariable Long setId,
            @AuthenticationPrincipal UserDetails userDetails) {
        gameSetRepository.findByIdForUser(setId, userDetails.getUsername())
                .orElseThrow(() -> new NoSuchElementException("Set introuvable: " + setId));
        trackRepository.deleteAllByGameSet_Id(setId);
        gameSetRepository.deleteById(setId);
        return ResponseEntity.noContent().build();
    }

    // ── Tracks ───────────────────────────────────────────────────────────────

    @GetMapping("/sets/{setId}/tracks")
    public ResponseEntity<List<BlindTestTrackDTO>> getTracks(
            @PathVariable Long setId,
            @AuthenticationPrincipal UserDetails userDetails) {
        gameSetRepository.findByIdForUser(setId, userDetails.getUsername())
                .orElseThrow(() -> new NoSuchElementException("Set introuvable: " + setId));
        return ResponseEntity.ok(
                trackRepository.findByGameSet_IdOrderByPosition(setId)
                        .stream().map(BlindTestTrackDTO::from).toList()
        );
    }

    @PostMapping("/sets/{setId}/tracks")
    public ResponseEntity<BlindTestTrackDTO> addTrack(
            @PathVariable Long setId,
            @RequestBody BlindTestTrackRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        GameSet gameSet = gameSetRepository.findByIdForUser(setId, userDetails.getUsername())
                .orElseThrow(() -> new NoSuchElementException("Set introuvable: " + setId));
        int position = trackRepository.findByGameSet_IdOrderByPosition(setId).size();
        BlindTestTrack track = new BlindTestTrack(req.title(), req.artist(), req.deezerTrackId(), gameSet, position);
        return ResponseEntity.status(HttpStatus.CREATED).body(BlindTestTrackDTO.from(trackRepository.save(track)));
    }

    @DeleteMapping("/tracks/{trackId}")
    public ResponseEntity<Void> deleteTrack(
            @PathVariable Long trackId,
            @AuthenticationPrincipal UserDetails userDetails) {
        BlindTestTrack track = trackRepository.findById(trackId)
                .orElseThrow(() -> new NoSuchElementException("Track introuvable: " + trackId));
        gameSetRepository.findByIdForUser(track.getGameSet().getId(), userDetails.getUsername())
                .orElseThrow(() -> new NoSuchElementException("Non autorisé"));
        trackRepository.delete(track);
        return ResponseEntity.noContent().build();
    }

    // ── Deezer proxy ─────────────────────────────────────────────────────────

    @GetMapping("/deezer/search")
    public ResponseEntity<List<DeezerSearchResultDTO>> searchDeezer(@RequestParam String q) {
        return ResponseEntity.ok(deezerService.search(q));
    }

    // ── État public (pour l'écran TV / panel de contrôle sans auth) ──────────

    @GetMapping("/state/by-token/{token}")
    public ResponseEntity<BlindTestStateDTO> getStateByToken(@PathVariable String token) {
        return ResponseEntity.ok(gameService.getStateByToken(token));
    }
}
