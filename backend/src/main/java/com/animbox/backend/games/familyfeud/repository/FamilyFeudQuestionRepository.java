package com.animbox.backend.games.familyfeud.repository;

import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyFeudQuestionRepository extends JpaRepository<FamilyFeudQuestion, Long> {
}
