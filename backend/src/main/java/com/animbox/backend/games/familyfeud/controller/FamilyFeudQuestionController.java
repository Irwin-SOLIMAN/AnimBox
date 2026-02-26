package com.animbox.backend.games.familyfeud.controller;

import com.animbox.backend.games.familyfeud.dto.FamilyFeudQuestionRequest;
import com.animbox.backend.games.familyfeud.dto.FamilyFeudQuestionResponse;
import com.animbox.backend.games.familyfeud.service.FamilyFeudQuestionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family-feud/questions")
public class FamilyFeudQuestionController {

    private final FamilyFeudQuestionService questionService;

    public FamilyFeudQuestionController(FamilyFeudQuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ResponseEntity<List<FamilyFeudQuestionResponse>> findAll() {
        return ResponseEntity.ok(questionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FamilyFeudQuestionResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<FamilyFeudQuestionResponse> create(@Valid @RequestBody FamilyFeudQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FamilyFeudQuestionResponse> update(@PathVariable Long id,
                                                             @Valid @RequestBody FamilyFeudQuestionRequest request) {
        return ResponseEntity.ok(questionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
