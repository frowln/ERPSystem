package com.privod.platform.modules.auth.service;

import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Формирует полный экспорт персональных данных пользователя (ст. 14 152-ФЗ / GDPR Art. 20).
 *
 * Включает профиль, проекты, задачи, журнал входов и записи о согласиях.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDataExportService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public Map<String, Object> exportUserData(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));

        Map<String, Object> export = new LinkedHashMap<>();
        export.put("exportedAt", Instant.now().toString());
        export.put("userId", userId.toString());

        // 1. User profile
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("email", user.getEmail());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("phone", user.getPhone());
        profile.put("position", user.getPosition());
        profile.put("enabled", user.isEnabled());
        profile.put("twoFactorEnabled", user.isTwoFactorEnabled());
        profile.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
        profile.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        profile.put("roles", user.getRoles().stream()
                .map(r -> r.getCode())
                .toList());
        export.put("profile", profile);

        // 2. Projects the user participates in
        List<Map<String, Object>> projects = jdbcTemplate.queryForList(
                "SELECT p.id, p.name, p.status, p.created_at " +
                "FROM projects p " +
                "LEFT JOIN project_members pm ON pm.project_id = p.id " +
                "WHERE (p.created_by = ? OR pm.user_id = ?) AND p.deleted = false " +
                "ORDER BY p.created_at DESC " +
                "LIMIT 500",
                userId.toString(), userId);
        export.put("projects", projects);

        // 3. Tasks assigned to the user
        List<Map<String, Object>> tasks = jdbcTemplate.queryForList(
                "SELECT t.id, t.title, t.status, t.priority, t.created_at " +
                "FROM tasks t " +
                "WHERE t.assignee_id = ? AND t.deleted = false " +
                "ORDER BY t.created_at DESC " +
                "LIMIT 500",
                userId);
        export.put("tasks", tasks);

        // 4. Login audit log (last 100 entries)
        List<Map<String, Object>> auditLogs = jdbcTemplate.queryForList(
                "SELECT id, action, ip_address, user_agent, success, created_at " +
                "FROM login_audit_log " +
                "WHERE user_id = ? " +
                "ORDER BY created_at DESC " +
                "LIMIT 100",
                userId);
        export.put("loginAuditLog", auditLogs);

        // 5. Data consent records
        List<Map<String, Object>> consents = jdbcTemplate.queryForList(
                "SELECT id, consent_type, consented_at, revoked_at, consent_version, " +
                "legal_basis, purpose, is_active " +
                "FROM data_consents " +
                "WHERE user_id = ? " +
                "ORDER BY consented_at DESC",
                userId);
        export.put("dataConsents", consents);

        log.info("User data exported per 152-ФЗ Art.14 / GDPR Art.20: userId={}", userId);
        return export;
    }
}
