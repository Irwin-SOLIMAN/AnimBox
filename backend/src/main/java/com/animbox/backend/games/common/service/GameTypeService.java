package com.animbox.backend.games.common.service;

import com.animbox.backend.games.common.dto.GameTypeResponse;
import com.animbox.backend.games.common.repository.GameTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class GameTypeService {

    private final GameTypeRepository gameTypeRepository;

    public GameTypeService(GameTypeRepository gameTypeRepository) {
        this.gameTypeRepository = gameTypeRepository;
    }

    public List<GameTypeResponse> findAll() {
        return gameTypeRepository.findAll()
                .stream()
                .map(GameTypeResponse::from)
                .toList();
    }

    public GameTypeResponse findById(Long id) {
        return gameTypeRepository.findById(id)
                .map(GameTypeResponse::from)
                .orElseThrow(() -> new NoSuchElementException("GameType introuvable : " + id));
    }
}
