package com.animbox.backend.games.common.repository;

import com.animbox.backend.games.common.model.GameSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GameSetRepository extends JpaRepository<GameSet, Long> {

    List<GameSet> findByCreatedByEmail(String email);

    Optional<GameSet> findByIdAndCreatedByEmail(Long id, String email);

    @Query("SELECT gs FROM GameSet gs WHERE gs.createdBy.email = :email OR gs.isPublic = true")
    List<GameSet> findAllForUser(@Param("email") String email);

    @Query("SELECT gs FROM GameSet gs WHERE gs.id = :id AND (gs.createdBy.email = :email OR gs.isPublic = true)")
    Optional<GameSet> findByIdForUser(@Param("id") Long id, @Param("email") String email);

    long countByIsPublicTrue();
}
