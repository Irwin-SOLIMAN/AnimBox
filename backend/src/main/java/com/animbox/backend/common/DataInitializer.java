package com.animbox.backend.common;

import com.animbox.backend.games.common.model.GameType;
import com.animbox.backend.games.common.repository.GameTypeRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final GameTypeRepository gameTypeRepository;

    public DataInitializer(GameTypeRepository gameTypeRepository) {
        this.gameTypeRepository = gameTypeRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedGameType(
                "FAMILY_FEUD",
                "Une Famille en Or",
                "Jeu de culture générale en équipe inspiré de Famille en Or.",
                12
        );
    }

    private void seedGameType(String code, String name, String description, int maxPlayers) {
        if (gameTypeRepository.findByCode(code).isEmpty()) {
            gameTypeRepository.save(new GameType(code, name, description, maxPlayers));
        }
    }
}
