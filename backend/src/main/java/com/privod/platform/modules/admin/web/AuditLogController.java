package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.audit.AuditLog;
import com.privod.platform.infrastructure.audit.AuditLogRepository;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "System audit log viewer")
public class AuditLogController {
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "Get audit logs with pagination")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AuditLog> page;
        if (entityType != null && entityId != null) {
            page = auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        } else if (from != null && to != null) {
            page = auditLogRepository.findByTimestampBetween(from, to, pageable);
        } else {
            page = auditLogRepository.findAll(pageable);
        }

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @Operation(summary = "Get audit history for a specific entity")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {
        List<AuditLog> logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get audit logs for a specific user")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getUserLogs(@PathVariable UUID userId) {
        List<AuditLog> logs = auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
