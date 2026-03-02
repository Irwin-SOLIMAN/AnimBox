package com.animbox.backend.games.common.model;

import com.animbox.backend.auth.model.User;
import com.animbox.backend.common.model.BaseEntity;
import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "game_sets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GameSet extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @ManyToOne(optional = false)
    @JoinColumn(name = "game_type_id")
    private GameType gameType;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // @OrderColumn ajoute une colonne "position" dans la table de jointure
    // pour conserver l'ordre des questions défini par l'animateur
    @ManyToMany
    @JoinTable(
            name = "game_set_questions",
            joinColumns = @JoinColumn(name = "game_set_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    @OrderColumn(name = "position")
    private List<FamilyFeudQuestion> questions = new ArrayList<>();

    public GameSet(String name, GameType gameType, User createdBy) {
        this.name = name;
        this.gameType = gameType;
        this.createdBy = createdBy;
    }

    public void update(String name) {
        this.name = name;
    }

    public void setQuestions(List<FamilyFeudQuestion> questions) {
        this.questions.clear();
        this.questions.addAll(questions);
    }
}
