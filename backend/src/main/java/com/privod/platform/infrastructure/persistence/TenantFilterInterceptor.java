package com.privod.platform.infrastructure.persistence;

import com.privod.platform.infrastructure.security.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

/**
 * Enables the Hibernate tenant filter on every authenticated request.
 * <p>
 * For each incoming request where the user has an organizationId in their principal,
 * the filter is enabled on the Hibernate session with the tenant's UUID.
 * This provides automatic, defense-in-depth tenant isolation at the ORM layer —
 * even if a service forgets to filter by organizationId, the Hibernate filter
 * will silently exclude rows from other tenants.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TenantFilterInterceptor implements HandlerInterceptor {

    public static final String TENANT_FILTER_NAME = "tenantFilter";
    public static final String TENANT_FILTER_PARAM = "organizationId";

    private final EntityManager entityManager;

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) {
        SecurityUtils.getCurrentOrganizationId().ifPresent(this::enableTenantFilter);
        return true;
    }

    private void enableTenantFilter(UUID organizationId) {
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter(TENANT_FILTER_NAME)
                .setParameter(TENANT_FILTER_PARAM, organizationId);
    }
}
