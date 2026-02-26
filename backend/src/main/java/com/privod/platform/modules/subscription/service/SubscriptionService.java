package com.privod.platform.modules.subscription.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.subscription.domain.BillingRecord;
import com.privod.platform.modules.subscription.domain.BillingType;
import com.privod.platform.modules.subscription.domain.PaymentStatus;
import com.privod.platform.modules.subscription.domain.PlanName;
import com.privod.platform.modules.subscription.domain.SubscriptionPlan;
import com.privod.platform.modules.subscription.domain.SubscriptionStatus;
import com.privod.platform.modules.subscription.domain.TenantSubscription;
import com.privod.platform.modules.subscription.repository.BillingRecordRepository;
import com.privod.platform.modules.subscription.repository.SubscriptionPlanRepository;
import com.privod.platform.modules.subscription.repository.TenantSubscriptionRepository;
import com.privod.platform.modules.subscription.web.dto.BillingRecordResponse;
import com.privod.platform.modules.subscription.web.dto.QuotaResponse;
import com.privod.platform.modules.subscription.web.dto.SubscriptionPlanResponse;
import com.privod.platform.modules.subscription.web.dto.TenantSubscriptionResponse;
import com.privod.platform.modules.subscription.web.dto.UsageResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final TenantSubscriptionRepository subscriptionRepository;
    private final BillingRecordRepository billingRecordRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> getPlans() {
        return planRepository.findByIsActiveTrueAndDeletedFalseOrderByPriceAsc()
                .stream()
                .map(SubscriptionPlanResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TenantSubscriptionResponse getCurrentSubscription(UUID organizationId) {
        TenantSubscription sub = subscriptionRepository
                .findByOrganizationIdAndDeletedFalse(organizationId)
                .orElse(null);

        if (sub == null) {
            // Auto-create a FREE plan subscription for new tenants
            return createDefaultSubscription(organizationId);
        }

        SubscriptionPlan plan = planRepository.findByIdAndDeletedFalse(sub.getPlanId())
                .orElseThrow(() -> new EntityNotFoundException("План подписки не найден: " + sub.getPlanId()));

        return TenantSubscriptionResponse.fromEntity(sub, plan.getName().name(), plan.getDisplayName());
    }

    @Transactional
    public TenantSubscriptionResponse changePlan(UUID organizationId, UUID planId) {
        SubscriptionPlan newPlan = planRepository.findByIdAndDeletedFalse(planId)
                .orElseThrow(() -> new EntityNotFoundException("План подписки не найден: " + planId));

        TenantSubscription sub = subscriptionRepository
                .findByOrganizationIdAndDeletedFalse(organizationId)
                .orElse(null);

        if (sub == null) {
            sub = TenantSubscription.builder()
                    .organizationId(organizationId)
                    .planId(planId)
                    .status(SubscriptionStatus.ACTIVE)
                    .startDate(Instant.now())
                    .build();
        } else {
            sub.setPlanId(planId);
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setStartDate(Instant.now());
            sub.setEndDate(null);
        }

        sub = subscriptionRepository.save(sub);
        auditService.logCreate("TenantSubscription", sub.getId());

        // Create billing record for plan change
        if (newPlan.getPrice().compareTo(BigDecimal.ZERO) > 0) {
            BillingRecord billingRecord = BillingRecord.builder()
                    .organizationId(organizationId)
                    .subscriptionId(sub.getId())
                    .planName(newPlan.getName().name())
                    .planDisplayName(newPlan.getDisplayName())
                    .amount(newPlan.getPrice())
                    .currency(newPlan.getCurrency())
                    .billingType(BillingType.SUBSCRIPTION)
                    .paymentStatus(PaymentStatus.PENDING)
                    .invoiceDate(Instant.now())
                    .periodStart(Instant.now())
                    .periodEnd(newPlan.getBillingPeriod() == com.privod.platform.modules.subscription.domain.BillingPeriod.YEARLY
                            ? Instant.now().plus(365, ChronoUnit.DAYS)
                            : Instant.now().plus(30, ChronoUnit.DAYS))
                    .invoiceNumber("INV-" + System.currentTimeMillis())
                    .description("Подписка: " + newPlan.getDisplayName())
                    .build();
            billingRecordRepository.save(billingRecord);
        }

        log.info("Подписка изменена для организации {} на план {}", organizationId, newPlan.getName());
        return TenantSubscriptionResponse.fromEntity(sub, newPlan.getName().name(), newPlan.getDisplayName());
    }

    @Transactional(readOnly = true)
    public boolean checkFeatureAccess(UUID organizationId, String featureKey) {
        TenantSubscription sub = subscriptionRepository
                .findByOrganizationIdAndDeletedFalse(organizationId)
                .orElse(null);

        if (sub == null) {
            return false;
        }

        if (sub.getStatus() != SubscriptionStatus.ACTIVE && sub.getStatus() != SubscriptionStatus.TRIAL) {
            return false;
        }

        SubscriptionPlan plan = planRepository.findByIdAndDeletedFalse(sub.getPlanId())
                .orElse(null);
        if (plan == null) {
            return false;
        }

        if (plan.getFeatures() == null || plan.getFeatures().isBlank()) {
            return false;
        }

        return plan.getFeatures().contains(featureKey);
    }

    @Transactional(readOnly = true)
    public QuotaResponse checkQuota(UUID organizationId, String quotaType) {
        TenantSubscription sub = subscriptionRepository
                .findByOrganizationIdAndDeletedFalse(organizationId)
                .orElse(null);

        if (sub == null) {
            return new QuotaResponse(quotaType, 0, 0, true);
        }

        SubscriptionPlan plan = planRepository.findByIdAndDeletedFalse(sub.getPlanId())
                .orElseThrow(() -> new EntityNotFoundException("План подписки не найден: " + sub.getPlanId()));

        return switch (quotaType) {
            case "users" -> {
                long currentUsers = userRepository.findByOrganizationId(organizationId, Pageable.unpaged()).getTotalElements();
                int maxUsers = plan.getMaxUsers() != null ? plan.getMaxUsers() : Integer.MAX_VALUE;
                yield new QuotaResponse("users", currentUsers, maxUsers, currentUsers >= maxUsers);
            }
            case "projects" -> {
                long currentProjects = projectRepository.countActiveProjectsByOrganizationId(organizationId);
                int maxProjects = plan.getMaxProjects() != null ? plan.getMaxProjects() : Integer.MAX_VALUE;
                yield new QuotaResponse("projects", currentProjects, maxProjects, currentProjects >= maxProjects);
            }
            case "storage" -> {
                // Storage tracking would require a dedicated service; return plan limits for now
                int maxStorage = plan.getMaxStorageGb() != null ? plan.getMaxStorageGb() : Integer.MAX_VALUE;
                yield new QuotaResponse("storage", 0, maxStorage, false);
            }
            default -> new QuotaResponse(quotaType, 0, 0, false);
        };
    }

    @Transactional(readOnly = true)
    public UsageResponse getUsage(UUID organizationId) {
        TenantSubscription sub = subscriptionRepository
                .findByOrganizationIdAndDeletedFalse(organizationId)
                .orElse(null);

        SubscriptionPlan plan;
        if (sub != null) {
            plan = planRepository.findByIdAndDeletedFalse(sub.getPlanId())
                    .orElseThrow(() -> new EntityNotFoundException("План подписки не найден"));
        } else {
            plan = planRepository.findByNameAndDeletedFalse(PlanName.FREE)
                    .orElseThrow(() -> new EntityNotFoundException("План FREE не найден"));
        }

        List<QuotaResponse> quotas = new ArrayList<>();
        quotas.add(checkQuota(organizationId, "users"));
        quotas.add(checkQuota(organizationId, "projects"));
        quotas.add(checkQuota(organizationId, "storage"));

        return new UsageResponse(plan.getName().name(), plan.getDisplayName(), quotas);
    }

    @Transactional(readOnly = true)
    public Page<BillingRecordResponse> getBillingHistory(UUID organizationId, Pageable pageable) {
        return billingRecordRepository
                .findByOrganizationIdAndDeletedFalseOrderByInvoiceDateDesc(organizationId, pageable)
                .map(BillingRecordResponse::fromEntity);
    }

    @Transactional
    private TenantSubscriptionResponse createDefaultSubscription(UUID organizationId) {
        SubscriptionPlan freePlan = planRepository.findByNameAndDeletedFalse(PlanName.FREE)
                .orElseThrow(() -> new EntityNotFoundException("План FREE не найден в системе"));

        TenantSubscription sub = TenantSubscription.builder()
                .organizationId(organizationId)
                .planId(freePlan.getId())
                .status(SubscriptionStatus.TRIAL)
                .startDate(Instant.now())
                .trialEndDate(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();

        sub = subscriptionRepository.save(sub);
        log.info("Создана подписка по умолчанию (FREE/TRIAL) для организации {}", organizationId);

        return TenantSubscriptionResponse.fromEntity(sub, freePlan.getName().name(), freePlan.getDisplayName());
    }
}
