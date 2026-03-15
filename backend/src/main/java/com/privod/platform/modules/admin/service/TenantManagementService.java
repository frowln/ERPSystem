package com.privod.platform.modules.admin.service;

import com.privod.platform.modules.admin.web.dto.TenantDetailResponse;
import com.privod.platform.modules.admin.web.dto.TenantListResponse;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.organization.domain.Organization;
import com.privod.platform.modules.organization.repository.OrganizationRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.subscription.domain.BillingRecord;
import com.privod.platform.modules.subscription.domain.SubscriptionPlan;
import com.privod.platform.modules.subscription.domain.SubscriptionStatus;
import com.privod.platform.modules.subscription.domain.TenantSubscription;
import com.privod.platform.modules.subscription.repository.BillingRecordRepository;
import com.privod.platform.modules.subscription.repository.SubscriptionPlanRepository;
import com.privod.platform.modules.subscription.repository.TenantSubscriptionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantManagementService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final BillingRecordRepository billingRecordRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public Page<TenantListResponse> findAllTenants(String search, Pageable pageable) {
        Page<Organization> page;
        if (search != null && !search.isBlank()) {
            page = organizationRepository.search(search.trim(), pageable);
        } else {
            page = organizationRepository.findAll(pageable);
        }
        // Filter out soft-deleted organizations
        return page.map(this::toTenantListResponse);
    }

    @Transactional(readOnly = true)
    public TenantDetailResponse getTenantDetail(UUID id) {
        Organization org = organizationRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Organization not found with id: " + id));

        long userCount = userRepository.countByOrganizationIdAndDeletedFalse(id);
        long projectCount = projectRepository.countActiveProjectsByOrganizationId(id);

        TenantSubscription subscription = tenantSubscriptionRepository
                .findByOrganizationIdAndDeletedFalse(id)
                .orElse(null);

        SubscriptionPlan plan = null;
        if (subscription != null) {
            plan = subscriptionPlanRepository.findByIdAndDeletedFalse(subscription.getPlanId())
                    .orElse(null);
        }

        String status = org.isActive() ? "ACTIVE" : "SUSPENDED";
        String planName = plan != null ? plan.getName().name() : "FREE";
        String planDisplayName = plan != null ? plan.getDisplayName() : "Бесплатный";
        UUID planId = plan != null ? plan.getId() : null;
        String subscriptionStatus = subscription != null ? subscription.getStatus().name() : "NONE";

        // Query last active timestamp from login audit logs (via user_id → users.organization_id)
        Instant lastActiveAt = null;
        try {
            lastActiveAt = jdbcTemplate.queryForObject(
                    """
                    SELECT MAX(l.created_at)
                    FROM login_audit_log l
                    JOIN users u ON u.id = l.user_id
                    WHERE u.organization_id = ?
                    """,
                    Instant.class, id);
        } catch (Exception e) {
            log.debug("Could not query lastActiveAt for tenant {}: {}", id, e.getMessage());
        }

        return new TenantDetailResponse(
                org.getId(),
                org.getName(),
                org.getInn(),
                org.getKpp(),
                org.getOgrn(),
                org.getLegalAddress(),
                org.getActualAddress(),
                org.getPhone(),
                org.getEmail(),
                org.getType().name(),
                org.isActive(),
                status,
                planName,
                planDisplayName,
                planId,
                subscriptionStatus,
                subscription != null ? subscription.getStartDate() : null,
                subscription != null ? subscription.getEndDate() : null,
                subscription != null ? subscription.getTrialEndDate() : null,
                userCount,
                projectCount,
                0L, // storageUsedMb — placeholder
                org.getCreatedAt(),
                org.getUpdatedAt(),
                lastActiveAt
        );
    }

    @Transactional
    public TenantDetailResponse updateTenantStatus(UUID id, String status) {
        Organization org = organizationRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Organization not found with id: " + id));

        switch (status) {
            case "ACTIVE":
                org.setActive(true);
                break;
            case "SUSPENDED":
                org.setActive(false);
                break;
            case "CANCELLED":
                org.setActive(false);
                // Also cancel subscription if exists
                tenantSubscriptionRepository.findByOrganizationIdAndDeletedFalse(id)
                        .ifPresent(sub -> {
                            sub.setStatus(SubscriptionStatus.CANCELLED);
                            tenantSubscriptionRepository.save(sub);
                        });
                break;
            default:
                throw new IllegalArgumentException("Invalid status: " + status);
        }

        organizationRepository.save(org);
        log.info("Tenant {} status updated to {}", id, status);
        return getTenantDetail(id);
    }

    @Transactional
    public TenantDetailResponse updateTenantPlan(UUID id, UUID planId) {
        Organization org = organizationRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Organization not found with id: " + id));

        SubscriptionPlan plan = subscriptionPlanRepository.findByIdAndDeletedFalse(planId)
                .orElseThrow(() -> new EntityNotFoundException("Subscription plan not found with id: " + planId));

        TenantSubscription subscription = tenantSubscriptionRepository
                .findByOrganizationIdAndDeletedFalse(id)
                .orElseGet(() -> {
                    TenantSubscription newSub = TenantSubscription.builder()
                            .organizationId(id)
                            .planId(planId)
                            .status(SubscriptionStatus.ACTIVE)
                            .build();
                    return tenantSubscriptionRepository.save(newSub);
                });

        subscription.setPlanId(planId);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        tenantSubscriptionRepository.save(subscription);

        log.info("Tenant {} plan updated to {}", id, plan.getName());
        return getTenantDetail(id);
    }

    @Transactional
    public TenantDetailResponse extendSubscription(UUID id, int months) {
        Organization org = organizationRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Organization not found with id: " + id));

        TenantSubscription subscription = tenantSubscriptionRepository
                .findByOrganizationIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("No subscription found for organization: " + id));

        Instant currentEnd = subscription.getEndDate();
        Instant baseDate = (currentEnd != null && currentEnd.isAfter(Instant.now()))
                ? currentEnd
                : Instant.now();

        Instant newEndDate = baseDate.plus((long) months * 30, ChronoUnit.DAYS);
        subscription.setEndDate(newEndDate);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        tenantSubscriptionRepository.save(subscription);

        log.info("Tenant {} subscription extended by {} months, new endDate={}", id, months, newEndDate);
        return getTenantDetail(id);
    }

    @Transactional(readOnly = true)
    public Page<BillingRecord> getTenantBillingRecords(UUID organizationId, Pageable pageable) {
        // Verify org exists
        organizationRepository.findById(organizationId)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Organization not found with id: " + organizationId));

        return billingRecordRepository.findByOrganizationIdAndDeletedFalseOrderByInvoiceDateDesc(
                organizationId, pageable);
    }

    private TenantListResponse toTenantListResponse(Organization org) {
        long userCount = userRepository.countByOrganizationIdAndDeletedFalse(org.getId());
        long projectCount = projectRepository.countActiveProjectsByOrganizationId(org.getId());

        TenantSubscription subscription = tenantSubscriptionRepository
                .findByOrganizationIdAndDeletedFalse(org.getId())
                .orElse(null);

        SubscriptionPlan plan = null;
        if (subscription != null) {
            plan = subscriptionPlanRepository.findByIdAndDeletedFalse(subscription.getPlanId())
                    .orElse(null);
        }

        String status = org.isActive() ? "ACTIVE" : "SUSPENDED";
        String planName = plan != null ? plan.getName().name() : "FREE";

        return new TenantListResponse(
                org.getId(),
                org.getName(),
                org.getInn(),
                status,
                planName,
                userCount,
                projectCount,
                org.getCreatedAt()
        );
    }
}
