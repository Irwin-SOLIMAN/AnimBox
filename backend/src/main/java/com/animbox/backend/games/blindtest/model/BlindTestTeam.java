package com.animbox.backend.games.blindtest.model;

import com.animbox.backend.common.model.BaseEntity;
import com.animbox.backend.games.common.model.GameSession;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blind_test_teams")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlindTestTeam extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id")
    private GameSession session;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int score = 0;

    @Column(nullable = false)
    private int position;

    public BlindTestTeam(GameSession session, String name, int position) {
        this.session = session;
        this.name = name;
        this.position = position;
    }

    public void addScore(int points) {
        this.score += points;
    }

    public void setScore(int score) {
        this.score = Math.max(0, score);
    }
}
