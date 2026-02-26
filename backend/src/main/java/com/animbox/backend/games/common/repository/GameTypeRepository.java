package com.animbox.backend.games.common.repository;

import com.animbox.backend.games.common.model.GameType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameTypeRepository extends JpaRepository<GameType, Long> {

    Optional<GameType> findByCode(String code);
}
