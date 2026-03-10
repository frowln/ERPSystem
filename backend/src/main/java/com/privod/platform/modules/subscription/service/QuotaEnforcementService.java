package com.privod.platform.modules.subscription.service;

import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.subscription.domain.SubscriptionPlan;
import com.privod.platform.modules.subscription.domain.SubscriptionStatus;
import com.privod.platform.modules.subscription.domain.TenantSubscription;
import com.privod.platform.modules.subscription.exception.QuotaExceededException;
import com.privod.platform.modules.subscription.repository.SubscriptionPlanRepository;
import com.privod.platform.modules.subscription.repository.TenantSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuotaEnforcementService {

    private final TenantSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    /**
     * Checks whether the organization has reached its user quota.
     * Throws {@link QuotaExceededException} if the limit has been reached.
     */
    @Transactional(readOnly = true)
    public void checkUserQuota(UUID organizationId) {
        SubscriptionPlan plan = getCurrentPlan(organizationId);
        if (plan == null) {
            // No active subscription — allow by default (or could block; here we allow)
            return;
        }

        int maxUsers = plan.getMaxUsers() != null ? plan.getMaxUsers() : Integer.MAX_VALUE;
        long currentUsers = userRepository.countByOrganizationIdAndDeletedFalse(organizationId);
        if (currentUsers >= maxUsers) {
            log.warn("User quota exceeded for organization {}: current={}, max={}",
                    organizationId, currentUsers, maxUsers);
            throw new QuotaExceededException(
                    "Превышен лимит пользователей (" + maxUsers + ")");
        }
    }

    /**
     * Checks whether the organization has reached its project quota.
     * Throws {@link QuotaExceededException} if the limit has been reached.
     */
    @Transactional(readOnly = true)
    public void checkProjectQuota(UUID organizationId) {
        SubscriptionPlan plan = getCurrentPlan(organizationId);
        if (plan == null) {
            return;
        }

        int maxProjects = plan.getMaxProjects() != null ? plan.getMaxProjects() : Integer.MAX_VALUE;
        long currentProjects = projectRepository.countActiveProjectsByOrganizationId(organizationId);
        if (currentProjects >= maxProjects) {
            log.warn("Project quota exceeded for organization {}: current={}, max={}",
                    organizationId, currentProjects, maxProjects);
            throw new QuotaExceededException(
                    "Превышен лимит проектов (" + maxProjects + ")");
        }
    }

    /**
     * Checks whether the organization has reached its storage quota.
     * Throws {@link QuotaExceededException} if the limit has been reached.
     *
     * @param currentStorageGb the current storage usage in GB
     */
    @Transactional(readOnly = true)
    public void checkStorageQuota(UUID organizationId, long currentStorageGb) {
        SubscriptionPlan plan = getCurrentPlan(organizationId);
        if (plan == null) {
            return;
        }

        int maxStorageGb = plan.getMaxStorageGb() != null ? plan.getMaxStorageGb() : Integer.MAX_VALUE;
        if (currentStorageGb >= maxStorageGb) {
            log.warn("Storage quota exceeded for organization {}: current={}GB, max={}GB",
                    organizationId, currentStorageGb, maxStorageGb);
            throw new QuotaExceededException(
                    "Превышен лимит хранилища (" + maxStorageGb + " ГБ)");
        }
    }

    /**
     * Resolves the current {@link SubscriptionPlan} for the given organization.
     * Returns {@code null} if no active/trial subscription exists.
     */
    private SubscriptionPlan getCurrentPlan(UUID organizationId) {
        TenantSubscription sub = subscriptionRepository
                .findByOrganizationIdAndDeletedFalse(organizationId)
                .orElse(null);

        if (sub == null) {
            return null;
        }

        // Only enforce quotas for active or trial subscriptions
        if (sub.getStatus() != SubscriptionStatus.ACTIVE && sub.getStatus() != SubscriptionStatus.TRIAL) {
            return null;
        }

        return planRepository.findByIdAndDeletedFalse(sub.getPlanId())
                .orElse(null);
    }
}
