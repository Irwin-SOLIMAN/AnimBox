package com.animbox.backend.auth.service;

import com.animbox.backend.auth.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void sendVerificationEmail(User user, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String html = """
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px">
                  <h2 style="color:#17252A;margin-bottom:8px">Vérifiez votre email</h2>
                  <p style="color:#555;margin-bottom:24px">
                    Merci de vous être inscrit sur <strong>AnimBox</strong> !<br>
                    Cliquez sur le bouton ci-dessous pour activer votre compte.
                  </p>
                  <a href="%s"
                     style="display:inline-block;padding:12px 28px;background:#3AAFA9;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
                    Vérifier mon email
                  </a>
                  <p style="color:#aaa;font-size:12px;margin-top:24px">
                    Ce lien expire dans 24h. Si vous n'avez pas créé de compte, ignorez cet email.
                  </p>
                </div>
                """.formatted(link);

        send(user.getEmail(), "Vérifiez votre email — AnimBox", html);
    }

    public void sendPasswordResetEmail(User user, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String html = """
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px">
                  <h2 style="color:#17252A;margin-bottom:8px">Réinitialisation du mot de passe</h2>
                  <p style="color:#555;margin-bottom:24px">
                    Vous avez demandé à réinitialiser votre mot de passe <strong>AnimBox</strong>.<br>
                    Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                  </p>
                  <a href="%s"
                     style="display:inline-block;padding:12px 28px;background:#3AAFA9;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
                    Réinitialiser mon mot de passe
                  </a>
                  <p style="color:#aaa;font-size:12px;margin-top:24px">
                    Ce lien expire dans 1h. Si vous n'avez pas fait cette demande, ignorez cet email.
                  </p>
                </div>
                """.formatted(link);

        send(user.getEmail(), "Réinitialisation du mot de passe — AnimBox", html);
    }

    private void send(String to, String subject, String htmlBody) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Impossible d'envoyer l'email à " + to, e);
        }
    }
}
