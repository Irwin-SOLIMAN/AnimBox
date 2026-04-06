package com.animbox.backend.games.blindtest.model;

import com.animbox.backend.common.model.BaseEntity;
import com.animbox.backend.games.common.model.GameSet;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blind_test_tracks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlindTestTrack extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String artist;

    private Long deezerTrackId;

    @Column(nullable = false)
    private int pointsValue = 1;

    @Column(nullable = false)
    private int position = 0;

    @ManyToOne(optional = false)
    @JoinColumn(name = "game_set_id")
    private GameSet gameSet;

    public BlindTestTrack(String title, String artist, Long deezerTrackId, GameSet gameSet, int position) {
        this.title = title;
        this.artist = artist;
        this.deezerTrackId = deezerTrackId;
        this.gameSet = gameSet;
        this.position = position;
    }

    public void update(String title, String artist, Long deezerTrackId, int pointsValue) {
        this.title = title;
        this.artist = artist;
        this.deezerTrackId = deezerTrackId;
        this.pointsValue = pointsValue;
    }
}
