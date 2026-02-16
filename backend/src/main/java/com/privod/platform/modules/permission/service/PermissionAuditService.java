package com.privod.platform.modules.permission.service;

import com.privod.platform.modules.permission.domain.AuditPermissionChange;
import com.privod.platform.modules.permission.domain.PermissionAuditAction;
import com.privod.platform.modules.permission.repository.AuditPermissionChangeRepository;
import com.privod.platform.infrastructure.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionAuditService {

    private final AuditPermissionChangeRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(PermissionAuditAction action, UUID targetUserId, UUID groupId, String details) {
        UUID currentUserId = getCurrentUserId();
        String ipAddress = getClientIpAddress();

        AuditPermissionChange audit = AuditPermissionChange.builder()
                .userId(currentUserId != null ? currentUserId : UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .action(action)
                .targetUserId(targetUserId)
                .groupId(groupId)
                .details(details)
                .ipAddress(ipAddress)
                .createdAt(Instant.now())
                .build();

        repository.save(audit);
        log.debug("Permission audit: {} targetUser={} group={}", action, targetUserId, groupId);
    }

    public void logGrant(UUID targetUserId, UUID groupId) {
        logAction(PermissionAuditAction.GRANT, targetUserId, groupId, null);
    }

    public void logRevoke(UUID targetUserId, UUID groupId) {
        logAction(PermissionAuditAction.REVOKE, targetUserId, groupId, null);
    }

    public void logGroupCreate(UUID groupId, String details) {
        logAction(PermissionAuditAction.CREATE_GROUP, null, groupId, details);
    }

    public void logGroupUpdate(UUID groupId, String details) {
        logAction(PermissionAuditAction.UPDATE_GROUP, null, groupId, details);
    }

    public void logGroupDelete(UUID groupId) {
        logAction(PermissionAuditAction.DELETE_GROUP, null, groupId, null);
    }

    public void logModelAccessChange(UUID groupId, String details) {
        logAction(PermissionAuditAction.SET_MODEL_ACCESS, null, groupId, details);
    }

    public void logBulkAssign(UUID groupId, String details) {
        logAction(PermissionAuditAction.BULK_ASSIGN, null, groupId, details);
    }

    private UUID getCurrentUserId() {
        return SecurityUtils.getCurrentUserId().orElse(null);
    }

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String[] headerNames = {"X-Forwarded-For", "X-Real-IP", "Proxy-Client-IP", "WL-Proxy-Client-IP"};
                for (String header : headerNames) {
                    String ip = request.getHeader(header);
                    if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                        return ip.split(",")[0].trim();
                    }
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Could not determine IP address for permission audit", e);
        }
        return null;
    }
}
