package com.privod.platform.infrastructure.security;

import com.privod.platform.modules.permission.domain.AccessOperation;
import com.privod.platform.modules.permission.repository.UserGroupRepository;
import com.privod.platform.modules.permission.service.PermissionCheckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * AOP aspect that enforces model-level access permissions from the permission matrix.
 *
 * <p>Logic:
 * <ol>
 *   <li>Get the current authenticated user ID.</li>
 *   <li>If user has no group assignments → allow (backwards-compatible for users without groups).</li>
 *   <li>If user has groups → check {@code PermissionCheckService.hasModelAccess()}.</li>
 *   <li>If denied → throw AccessDeniedException (Spring Security converts to 403).</li>
 * </ol>
 *
 * <p>ADMIN role always bypasses this check.</p>
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ModelAccessAspect {

    private final PermissionCheckService permissionCheckService;
    private final UserGroupRepository userGroupRepository;

    @Around("@annotation(checkModelAccess)")
    public Object checkAccess(ProceedingJoinPoint joinPoint, CheckModelAccess checkModelAccess) throws Throwable {
        String model = checkModelAccess.model();
        AccessOperation operation = checkModelAccess.operation();

        // Get current user
        UUID userId = SecurityUtils.getCurrentUserId().orElse(null);
        if (userId == null) {
            // No authenticated user — let Spring Security handle it
            return joinPoint.proceed();
        }

        // ADMIN role always has full access
        if (SecurityUtils.hasRole("ADMIN")) {
            return joinPoint.proceed();
        }

        // Check if user has any group assignments
        List<UUID> groupIds = userGroupRepository.findGroupIdsByUserId(userId);
        if (groupIds.isEmpty()) {
            // No groups assigned — fall through to @PreAuthorize role check only
            log.debug("No permission groups for user {}; skipping model access check for {}.{}",
                    userId, model, operation);
            return joinPoint.proceed();
        }

        // User has groups — enforce model access matrix
        boolean allowed = permissionCheckService.hasModelAccess(userId, model, operation);
        if (!allowed) {
            log.warn("Model access DENIED: user={}, model={}, operation={}", userId, model, operation);
            throw new AccessDeniedException(
                    String.format("У вас нет прав на %s для %s",
                            operationLabel(operation), model));
        }

        log.debug("Model access GRANTED: user={}, model={}, operation={}", userId, model, operation);
        return joinPoint.proceed();
    }

    private String operationLabel(AccessOperation op) {
        return switch (op) {
            case READ -> "чтение";
            case CREATE -> "создание";
            case UPDATE -> "редактирование";
            case DELETE -> "удаление";
        };
    }
}
