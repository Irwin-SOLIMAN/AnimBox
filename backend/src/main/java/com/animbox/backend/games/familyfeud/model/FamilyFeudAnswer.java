package com.animbox.backend.games.familyfeud.model;

import com.animbox.backend.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "family_feud_answers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class FamilyFeudAnswer extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "question_id")
    private FamilyFeudQuestion question;

    @Column(nullable = false)
    private String text;

    // Position dans le classement (1 = réponse la plus fréquente)
    @Column(nullable = false)
    private int rank;

    // Points attribués pour cette réponse
    @Column(nullable = false)
    private int score;
}
