package com.animbox.backend.games.blindtest.repository;

import com.animbox.backend.games.blindtest.model.BlindTestTrack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlindTestTrackRepository extends JpaRepository<BlindTestTrack, Long> {
    List<BlindTestTrack> findByGameSet_IdOrderByPosition(Long gameSetId);
    void deleteAllByGameSet_Id(Long gameSetId);
}
