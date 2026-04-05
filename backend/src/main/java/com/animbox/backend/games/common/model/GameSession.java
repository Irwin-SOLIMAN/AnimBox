package com.animbox.backend.games.common.model;

import com.animbox.backend.auth.model.User;
import com.animbox.backend.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "game_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GameSession extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "game_set_id")
    private GameSet gameSet;

    @ManyToOne(optional = false)
    @JoinColumn(name = "host_id")
    private User host;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.WAITING;

    @Column(nullable = false)
    private int currentQuestionIndex = 0;

    @Column(nullable = false)
    private String teamAName;

    @Column(nullable = false)
    private String teamBName;

    @Column(nullable = false)
    private int teamAScore = 0;

    @Column(nullable = false)
    private int teamBScore = 0;

    // IDs des réponses déjà révélées au cours de la partie
    @ElementCollection
    @CollectionTable(
            name = "game_session_revealed_answers",
            joinColumns = @JoinColumn(name = "session_id")
    )
    @Column(name = "answer_id")
    private Set<Long> revealedAnswerIds = new HashSet<>();

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    // --- État spécifique Famille en Or ---

    // Nombre de fautes pour le tour en cours (reset à chaque question)
    @Column(nullable = false)
    private int currentFaults = 0;

    // Quelle équipe joue actuellement (accumule les points du tour)
    @Column(nullable = false)
    private boolean teamAPlaying = true;

    // true = l'équipe adverse a une tentative de vol
    @Column(nullable = false)
    private boolean stealPhase = false;

    @Column(unique = true, nullable = false, updatable = false)
    private String token;

    public GameSession(GameSet gameSet, User host, String teamAName, String teamBName) {
        this.gameSet = gameSet;
        this.host = host;
        this.teamAName = teamAName;
        this.teamBName = teamBName;
        this.token = UUID.randomUUID().toString();
    }

    public void start() {
        this.status = SessionStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
    }

    public void finish() {
        this.status = SessionStatus.FINISHED;
        this.finishedAt = LocalDateTime.now();
    }

    public void nextQuestion() {
        this.currentQuestionIndex++;
    }

    public void revealAnswer(Long answerId) {
        this.revealedAnswerIds.add(answerId);
    }

    public void addScore(boolean teamA, int points) {
        if (teamA) {
            this.teamAScore += points;
        } else {
            this.teamBScore += points;
        }
    }

    // Ajoute une faute ; déclenche le vol à 3 fautes
    public void addFault() {
        this.currentFaults++;
        if (this.currentFaults >= 3) {
            this.stealPhase = true;
        }
    }

    // Remet à zéro l'état du tour (appeler après fin de tour ou vol)
    public void resetRound() {
        this.currentFaults = 0;
        this.stealPhase = false;
    }

    // Change l'équipe qui joue (face-off, alternance inter-questions)
    public void switchTeam() {
        this.teamAPlaying = !this.teamAPlaying;
    }
}
