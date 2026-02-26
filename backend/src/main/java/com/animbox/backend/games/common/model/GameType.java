package com.animbox.backend.games.common.model;

import com.animbox.backend.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "game_types")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class GameType extends BaseEntity {

    // Identifiant technique stable pour le code (ex: "FAMILY_FEUD")
    @Column(nullable = false, unique = true)
    private String code;

    // Nom affiché à l'utilisateur (ex: "Une Famille en Or")
    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private int maxPlayers;
}
