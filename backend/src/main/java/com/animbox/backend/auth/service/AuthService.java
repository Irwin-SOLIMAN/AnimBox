package com.animbox.backend.auth.service;

import com.animbox.backend.auth.dto.*;
import com.animbox.backend.auth.model.EmailToken;
import com.animbox.backend.auth.model.EmailTokenType;
import com.animbox.backend.auth.model.Role;
import com.animbox.backend.auth.model.User;
import com.animbox.backend.auth.repository.EmailTokenRepository;
import com.animbox.backend.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmailTokenRepository emailTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email déjà utilisé : " + request.email());
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.ANIMATOR)
                .emailVerified(false)
                .build();

        userRepository.save(user);

        String token = createEmailToken(user, EmailTokenType.VERIFICATION, 24);
        emailService.sendVerificationEmail(user, token);

        return new MessageResponse("Un email de vérification a été envoyé à " + request.email());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException("Veuillez vérifier votre email avant de vous connecter");
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken);
    }

    public AuthResponse refresh(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Refresh token invalide ou expiré");
        }

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return new AuthResponse(newAccessToken, newRefreshToken);
    }

    @Transactional
    public AuthResponse verifyEmail(String token) {
        EmailToken emailToken = emailTokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new IllegalArgumentException("Lien de vérification invalide ou expiré"));

        if (emailToken.getType() != EmailTokenType.VERIFICATION) {
            throw new IllegalArgumentException("Lien de vérification invalide");
        }

        if (emailToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Lien de vérification expiré");
        }

        User user = emailToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        emailToken.setUsed(true);
        emailTokenRepository.save(emailToken);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        // Toujours retourner 200 pour ne pas exposer l'existence du compte
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            emailTokenRepository.deleteByUserAndType(user, EmailTokenType.PASSWORD_RESET);
            String token = createEmailToken(user, EmailTokenType.PASSWORD_RESET, 1);
            emailService.sendPasswordResetEmail(user, token);
        });

        return new MessageResponse("Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        EmailToken emailToken = emailTokenRepository.findByTokenAndUsedFalse(request.token())
                .orElseThrow(() -> new IllegalArgumentException("Lien de réinitialisation invalide ou expiré"));

        if (emailToken.getType() != EmailTokenType.PASSWORD_RESET) {
            throw new IllegalArgumentException("Lien de réinitialisation invalide");
        }

        if (emailToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Lien de réinitialisation expiré");
        }

        User user = emailToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        emailToken.setUsed(true);
        emailTokenRepository.save(emailToken);

        return new MessageResponse("Mot de passe mis à jour avec succès");
    }

    private String createEmailToken(User user, EmailTokenType type, int expiresInHours) {
        String token = UUID.randomUUID().toString();
        EmailToken emailToken = EmailToken.builder()
                .token(token)
                .user(user)
                .type(type)
                .expiresAt(LocalDateTime.now().plusHours(expiresInHours))
                .used(false)
                .build();
        emailTokenRepository.save(emailToken);
        return token;
    }

    /** Exception levée quand l'email n'est pas encore vérifié */
    public static class EmailNotVerifiedException extends RuntimeException {
        public EmailNotVerifiedException(String message) {
            super(message);
        }
    }
}
