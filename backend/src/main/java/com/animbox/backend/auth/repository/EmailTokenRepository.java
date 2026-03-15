package com.animbox.backend.auth.repository;

import com.animbox.backend.auth.model.EmailToken;
import com.animbox.backend.auth.model.EmailTokenType;
import com.animbox.backend.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailTokenRepository extends JpaRepository<EmailToken, Long> {

    Optional<EmailToken> findByTokenAndUsedFalse(String token);

    void deleteByUserAndType(User user, EmailTokenType type);
}
