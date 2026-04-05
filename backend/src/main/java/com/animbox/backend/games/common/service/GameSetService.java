package com.animbox.backend.games.common.service;

import com.animbox.backend.auth.model.User;
import com.animbox.backend.auth.repository.UserRepository;
import com.animbox.backend.games.common.dto.GameSetRequest;
import com.animbox.backend.games.common.dto.GameSetResponse;
import com.animbox.backend.games.common.model.GameSet;
import com.animbox.backend.games.common.model.GameType;
import com.animbox.backend.games.common.repository.GameSetRepository;
import com.animbox.backend.games.common.repository.GameTypeRepository;
import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;
import com.animbox.backend.games.familyfeud.repository.FamilyFeudQuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class GameSetService {

    private final GameSetRepository gameSetRepository;
    private final GameTypeRepository gameTypeRepository;
    private final FamilyFeudQuestionRepository questionRepository;
    private final UserRepository userRepository;

    public GameSetService(GameSetRepository gameSetRepository,
                          GameTypeRepository gameTypeRepository,
                          FamilyFeudQuestionRepository questionRepository,
                          UserRepository userRepository) {
        this.gameSetRepository = gameSetRepository;
        this.gameTypeRepository = gameTypeRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<GameSetResponse> findAllForUser(String email) {
        return gameSetRepository.findAllForUser(email)
                .stream()
                .map(GameSetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public GameSetResponse findById(Long id, String email) {
        return GameSetResponse.from(getOwnedGameSet(id, email));
    }

    public GameSetResponse create(GameSetRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable"));

        GameType gameType = gameTypeRepository.findById(request.gameTypeId())
                .orElseThrow(() -> new NoSuchElementException("GameType introuvable : " + request.gameTypeId()));

        GameSet gameSet = new GameSet(request.name(), gameType, user);
        gameSet.setQuestions(resolveOrderedQuestions(request.questionIds()));

        return GameSetResponse.from(gameSetRepository.save(gameSet));
    }

    public GameSetResponse update(Long id, GameSetRequest request, String email) {
        GameSet gameSet = getOwnedGameSet(id, email);
        gameSet.update(request.name());
        gameSet.setQuestions(resolveOrderedQuestions(request.questionIds()));
        return GameSetResponse.from(gameSetRepository.save(gameSet));
    }

    public void delete(Long id, String email) {
        gameSetRepository.delete(getOwnedGameSet(id, email));
    }

    // Résout les IDs en entités en conservant l'ordre de la liste fournie
    private List<FamilyFeudQuestion> resolveOrderedQuestions(List<Long> questionIds) {
        Map<Long, FamilyFeudQuestion> byId = questionRepository.findAllById(questionIds)
                .stream()
                .collect(Collectors.toMap(FamilyFeudQuestion::getId, Function.identity()));

        return questionIds.stream()
                .map(qId -> {
                    FamilyFeudQuestion q = byId.get(qId);
                    if (q == null) throw new NoSuchElementException("Question introuvable : " + qId);
                    return q;
                })
                .toList();
    }

    private GameSet getOwnedGameSet(Long id, String email) {
        return gameSetRepository.findByIdAndCreatedByEmail(id, email)
                .orElseThrow(() -> new NoSuchElementException("GameSet introuvable : " + id));
    }
}
