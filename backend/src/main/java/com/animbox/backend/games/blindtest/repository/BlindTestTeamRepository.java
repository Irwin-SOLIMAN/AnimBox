package com.animbox.backend.games.blindtest.repository;

import com.animbox.backend.games.blindtest.model.BlindTestTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlindTestTeamRepository extends JpaRepository<BlindTestTeam, Long> {
    List<BlindTestTeam> findBySession_IdOrderByPosition(Long sessionId);
    void deleteAllBySession_Id(Long sessionId);
}
