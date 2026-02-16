package com.privod.platform.infrastructure.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String entityType, UUID entityId, AuditAction action,
                          String field, String oldValue, String newValue) {
        UUID userId = null;
        String userName = null;
        String ipAddress = null;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            userName = auth.getName();
        }

        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                ipAddress = getClientIpAddress(request);
            }
        } catch (Exception e) {
            log.debug("Could not determine IP address for audit log", e);
        }

        AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .field(field)
                .oldValue(oldValue)
                .newValue(newValue)
                .userId(userId)
                .userName(userName)
                .timestamp(Instant.now())
                .ipAddress(ipAddress)
                .build();

        auditLogRepository.save(auditLog);
        log.debug("Audit log created: {} {} on {}:{}", action, field, entityType, entityId);
    }

    public void logCreate(String entityType, UUID entityId) {
        logAction(entityType, entityId, AuditAction.CREATE, null, null, null);
    }

    public void logUpdate(String entityType, UUID entityId, String field, String oldValue, String newValue) {
        logAction(entityType, entityId, AuditAction.UPDATE, field, oldValue, newValue);
    }

    public void logDelete(String entityType, UUID entityId) {
        logAction(entityType, entityId, AuditAction.DELETE, null, null, null);
    }

    public void logStatusChange(String entityType, UUID entityId, String oldStatus, String newStatus) {
        logAction(entityType, entityId, AuditAction.STATUS_CHANGE, "status", oldStatus, newStatus);
    }

    public List<AuditLog> getEntityHistory(String entityType, UUID entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };
        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
