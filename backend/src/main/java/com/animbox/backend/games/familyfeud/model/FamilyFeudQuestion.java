package com.animbox.backend.games.familyfeud.model;

import com.animbox.backend.common.model.BaseEntity;
import com.animbox.backend.games.common.model.GameType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "family_feud_questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FamilyFeudQuestion extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "game_type_id")
    private GameType gameType;

    @Column(nullable = false)
    private String text;

    private String category;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("rank ASC")
    private List<FamilyFeudAnswer> answers = new ArrayList<>();

    public FamilyFeudQuestion(GameType gameType, String text, String category) {
        this.gameType = gameType;
        this.text = text;
        this.category = category;
    }

    public void update(String text, String category) {
        this.text = text;
        this.category = category;
    }

    // Remplace toutes les réponses — orphanRemoval supprime les anciennes en DB
    public void replaceAnswers(List<FamilyFeudAnswer> newAnswers) {
        this.answers.clear();
        this.answers.addAll(newAnswers);
    }
}
