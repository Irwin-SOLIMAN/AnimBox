package com.animbox.backend.games.familyfeud.service;

import com.animbox.backend.games.common.model.GameType;
import com.animbox.backend.games.common.repository.GameTypeRepository;
import com.animbox.backend.games.familyfeud.dto.FamilyFeudQuestionRequest;
import com.animbox.backend.games.familyfeud.dto.FamilyFeudQuestionResponse;
import com.animbox.backend.games.familyfeud.model.FamilyFeudAnswer;
import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;
import com.animbox.backend.games.familyfeud.repository.FamilyFeudQuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class FamilyFeudQuestionService {

    private final FamilyFeudQuestionRepository questionRepository;
    private final GameTypeRepository gameTypeRepository;

    public FamilyFeudQuestionService(FamilyFeudQuestionRepository questionRepository,
                                     GameTypeRepository gameTypeRepository) {
        this.questionRepository = questionRepository;
        this.gameTypeRepository = gameTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<FamilyFeudQuestionResponse> findAll() {
        return questionRepository.findAll()
                .stream()
                .map(FamilyFeudQuestionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FamilyFeudQuestionResponse findById(Long id) {
        return questionRepository.findById(id)
                .map(FamilyFeudQuestionResponse::from)
                .orElseThrow(() -> new NoSuchElementException("Question introuvable : " + id));
    }

    public FamilyFeudQuestionResponse create(FamilyFeudQuestionRequest request) {
        GameType gameType = gameTypeRepository.findByCode("FAMILY_FEUD")
                .orElseThrow(() -> new NoSuchElementException("GameType FAMILY_FEUD introuvable"));

        FamilyFeudQuestion question = new FamilyFeudQuestion(gameType, request.text(), request.category());

        List<FamilyFeudAnswer> answers = request.answers().stream()
                .map(a -> new FamilyFeudAnswer(question, a.text(), a.rank(), a.score()))
                .toList();

        question.replaceAnswers(answers);
        return FamilyFeudQuestionResponse.from(questionRepository.save(question));
    }

    public FamilyFeudQuestionResponse update(Long id, FamilyFeudQuestionRequest request) {
        FamilyFeudQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Question introuvable : " + id));

        question.update(request.text(), request.category());

        List<FamilyFeudAnswer> answers = request.answers().stream()
                .map(a -> new FamilyFeudAnswer(question, a.text(), a.rank(), a.score()))
                .toList();

        question.replaceAnswers(answers);
        return FamilyFeudQuestionResponse.from(questionRepository.save(question));
    }

    public void delete(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new NoSuchElementException("Question introuvable : " + id);
        }
        questionRepository.deleteById(id);
    }
}
