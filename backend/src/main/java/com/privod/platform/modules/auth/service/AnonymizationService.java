package com.privod.platform.modules.auth.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Реализует право субъекта ПДн на удаление данных (ст. 21 152-ФЗ).
 *
 * Вместо физического удаления записей (нарушило бы ссылочную целостность)
 * данные заменяются на псевдонимизированные значения, а аккаунт деактивируется.
 * Связанные PII-таблицы очищаются транзакционно.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnonymizationService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void anonymizeCurrentUser() {
        UUID userId = SecurityUtils.requireCurrentUserId();
        anonymizeUser(userId);
    }

    @Transactional
    public void anonymizeUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));

        String anon = "deleted-" + userId.toString().substring(0, 8);
        String originalEmail = user.getEmail();
        String anonEmail = anon + "@deleted.invalid";

        // Anonymize linked Employee PII before changing email
        jdbcTemplate.update(
                "UPDATE employees SET passport_number = NULL, inn = NULL, snils = NULL, " +
                "phone = NULL, email = NULL, address = NULL " +
                "WHERE user_id = ?",
                userId);

        // Anonymize SelfEmployedWorker PII linked by original email
        jdbcTemplate.update(
                "UPDATE self_employed_workers SET phone = NULL, email = NULL " +
                "WHERE email = ?",
                originalEmail);

        // Anonymize portal user PII linked by original email
        jdbcTemplate.update(
                "UPDATE portal_users SET phone = NULL, company_name = '[Удалён]', " +
                "contact_person = '[Удалён]' WHERE email = ?",
                originalEmail);

        // Anonymize User entity last (email changes, so must be after foreign-key uses)
        user.setEmail(anonEmail);
        user.setFirstName("[Удалён]");
        user.setLastName("[Удалён]");
        user.setPhone(null);
        user.setPosition(null);
        user.setAvatarUrl(null);
        user.setEnabled(false);
        userRepository.save(user);

        // Deactivate active sessions
        jdbcTemplate.update(
                "DELETE FROM user_sessions WHERE user_id = ?", userId);

        // Mark data consents as withdrawn
        jdbcTemplate.update(
                "UPDATE data_consents SET is_active = false, deleted = true, " +
                "updated_at = ? WHERE user_id = ?",
                Instant.now(), userId);

        log.info("User data anonymized per 152-ФЗ Art.21 erasure request: userId={}", userId);
    }
}
