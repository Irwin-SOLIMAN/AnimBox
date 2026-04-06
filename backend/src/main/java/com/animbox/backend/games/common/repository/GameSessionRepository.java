package com.animbox.backend.games.common.repository;

import com.animbox.backend.games.common.model.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    List<GameSession> findByHostEmail(String email);

    Optional<GameSession> findByIdAndHostEmail(Long id, String email);

    Optional<GameSession> findByToken(String token);

    List<GameSession> findByHostEmailAndGameSet_GameType_Code(String email, String code);
}
