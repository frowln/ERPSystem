package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.admin.domain.LoginAuditLog;
import com.privod.platform.modules.admin.repository.LoginAuditLogRepository;
import com.privod.platform.modules.auth.repository.UserSessionRepository;
import com.privod.platform.modules.auth.domain.UserSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LoginAuditController {

    private final LoginAuditLogRepository loginAuditLogRepository;
    private final UserSessionRepository userSessionRepository;

    @GetMapping("/login-audit")
    public ResponseEntity<ApiResponse<PageResponse<LoginAuditLog>>> getLoginAudit(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Boolean failedOnly,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<LoginAuditLog> page;
        if (failedOnly != null && failedOnly) {
            page = loginAuditLogRepository.findBySuccessFalseOrderByCreatedAtDesc(pageable);
        } else if (email != null && !email.isBlank()) {
            page = loginAuditLogRepository.findByEmailOrderByCreatedAtDesc(email, pageable);
        } else if (action != null && !action.isBlank()) {
            page = loginAuditLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
        } else {
            page = loginAuditLogRepository.findByOrderByCreatedAtDesc(pageable);
        }
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/login-audit/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLoginStats() {
        Instant last24h = Instant.now().minus(24, ChronoUnit.HOURS);
        Instant last7d = Instant.now().minus(7, ChronoUnit.DAYS);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("uniqueLogins24h", loginAuditLogRepository.countUniqueLoginsSince(last24h));
        stats.put("uniqueLogins7d", loginAuditLogRepository.countUniqueLoginsSince(last7d));
        stats.put("activeSessions", userSessionRepository.countByIsActiveTrue());

        Map<String, Long> actionCounts = new LinkedHashMap<>();
        for (Object[] row : loginAuditLogRepository.countByActionSince(last24h)) {
            actionCounts.put((String) row[0], (Long) row[1]);
        }
        stats.put("actions24h", actionCounts);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/sessions/online")
    public ResponseEntity<ApiResponse<List<UserSession>>> getOnlineUsers() {
        List<UserSession> sessions = userSessionRepository.findByIsActiveTrueOrderByLastActivityAtDesc();
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    @GetMapping("/sessions/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserSession>>> getUserSessions(@PathVariable UUID userId) {
        List<UserSession> sessions = userSessionRepository.findByUserIdAndIsActiveTrueOrderByLastActivityAtDesc(userId);
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    @DeleteMapping("/sessions/user/{userId}")
    public ResponseEntity<ApiResponse<Void>> terminateUserSessions(@PathVariable UUID userId) {
        userSessionRepository.deactivateAllByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
