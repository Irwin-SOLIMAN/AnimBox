package com.animbox.backend.games.common.repository;

import com.animbox.backend.games.common.model.GameSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameSetRepository extends JpaRepository<GameSet, Long> {

    List<GameSet> findByCreatedByEmail(String email);

    Optional<GameSet> findByIdAndCreatedByEmail(Long id, String email);
}
