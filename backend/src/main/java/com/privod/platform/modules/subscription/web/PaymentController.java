package com.privod.platform.modules.subscription.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.subscription.domain.BillingRecord;
import com.privod.platform.modules.subscription.domain.BillingType;
import com.privod.platform.modules.subscription.domain.PaymentStatus;
import com.privod.platform.modules.subscription.domain.SubscriptionPlan;
import com.privod.platform.modules.subscription.domain.SubscriptionStatus;
import com.privod.platform.modules.subscription.domain.TenantSubscription;
import com.privod.platform.modules.subscription.repository.BillingRecordRepository;
import com.privod.platform.modules.subscription.repository.SubscriptionPlanRepository;
import com.privod.platform.modules.subscription.repository.TenantSubscriptionRepository;
import com.privod.platform.modules.subscription.service.YooKassaService;
import com.privod.platform.modules.subscription.web.dto.CreatePaymentRequest;
import com.privod.platform.modules.subscription.web.dto.PaymentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@RestController("subscriptionPaymentController")
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing via YooKassa")
@Slf4j
public class PaymentController {

    private final YooKassaService yooKassaService;
    private final SubscriptionPlanRepository planRepository;
    private final TenantSubscriptionRepository subscriptionRepository;
    private final BillingRecordRepository billingRecordRepository;

    @Value("${app.yookassa.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Create payment for subscription plan upgrade")
    @Transactional
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody CreatePaymentRequest request) {

        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String userEmail = SecurityUtils.getCurrentUserDetails()
                .map(d -> d.getEmail())
                .orElse("unknown@privod.ru");

        SubscriptionPlan plan = planRepository.findByIdAndDeletedFalse(request.planId())
                .orElseThrow(() -> new EntityNotFoundException("План подписки не найден"));

        if (plan.getPrice().signum() == 0) {
            throw new IllegalArgumentException("Бесплатный план не требует оплаты");
        }

        String idempotencyKey = UUID.randomUUID().toString();
        String description = "Подписка Привод: " + plan.getDisplayName();

        // Create billing record first (PENDING)
        TenantSubscription sub = subscriptionRepository
                .findByOrganizationIdAndDeletedFalse(organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Подписка не найдена"));

        BillingRecord record = BillingRecord.builder()
                .organizationId(organizationId)
                .subscriptionId(sub.getId())
                .planName(plan.getName().name())
                .planDisplayName(plan.getDisplayName())
                .amount(plan.getPrice())
                .currency(plan.getCurrency())
                .billingType(BillingType.SUBSCRIPTION)
                .paymentStatus(PaymentStatus.PENDING)
                .invoiceDate(Instant.now())
                .periodStart(Instant.now())
                .periodEnd(plan.getBillingPeriod() == com.privod.platform.modules.subscription.domain.BillingPeriod.YEARLY
                        ? Instant.now().plus(365, ChronoUnit.DAYS)
                        : Instant.now().plus(30, ChronoUnit.DAYS))
                .invoiceNumber("INV-" + java.time.LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .description(description)
                .yookassaIdempotency(idempotencyKey)
                .build();

        // Call YooKassa — throws RuntimeException on failure
        YooKassaService.PaymentResult result = yooKassaService.createPayment(
                plan.getPrice(), plan.getCurrency(), description, idempotencyKey, userEmail);

        record.setYookassaPaymentId(result.paymentId());
        record.setConfirmationUrl(result.confirmationUrl());

        record = billingRecordRepository.save(record);

        log.info("Payment created: billingRecordId={}, yookassaPaymentId={}",
                record.getId(), record.getYookassaPaymentId());

        return ResponseEntity.ok(ApiResponse.ok(new PaymentResponse(
                record.getId().toString(),
                result.confirmationUrl(),
                result.paymentId(),
                "pending"
        )));
    }

    /**
     * YooKassa webhook handler.
     * Receives payment status updates from YooKassa.
     */
    @PostMapping("/webhook/yookassa")
    @Operation(summary = "YooKassa payment webhook (called by YooKassa)")
    @Transactional
    public ResponseEntity<Void> handleYooKassaWebhook(
            @RequestBody String body,
            @RequestHeader(value = "X-YooKassa-Signature", required = false) String signature) {

        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (!verifyHmacSignature(body, signature, webhookSecret)) {
                log.warn("YooKassa webhook: HMAC signature verification failed");
                return ResponseEntity.status(401).build();
            }
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(body);

            String event = root.path("event").asText();
            JsonNode paymentObj = root.path("object");
            String paymentId = paymentObj.path("id").asText();
            String status = paymentObj.path("status").asText();

            log.info("YooKassa webhook: event={}, paymentId={}, status={}", event, paymentId, status);

            if (paymentId.isBlank()) {
                log.warn("YooKassa webhook: missing payment id");
                return ResponseEntity.ok().build();
            }

            BillingRecord record = billingRecordRepository.findByYookassaPaymentId(paymentId)
                    .orElse(null);

            if (record == null) {
                log.warn("YooKassa webhook: no billing record for paymentId={}", paymentId);
                return ResponseEntity.ok().build();
            }

            switch (status) {
                case "succeeded" -> {
                    record.setPaymentStatus(PaymentStatus.PAID);
                    record.setPaidDate(Instant.now());
                    billingRecordRepository.save(record);

                    // Activate subscription
                    subscriptionRepository.findById(record.getSubscriptionId()).ifPresent(sub -> {
                        UUID newPlanId = planRepository.findByNameAndDeletedFalse(
                                com.privod.platform.modules.subscription.domain.PlanName.valueOf(record.getPlanName())
                        ).map(SubscriptionPlan::getId).orElse(sub.getPlanId());

                        sub.setPlanId(newPlanId);
                        sub.setStatus(SubscriptionStatus.ACTIVE);
                        sub.setStartDate(record.getPeriodStart());
                        sub.setEndDate(record.getPeriodEnd());
                        subscriptionRepository.save(sub);
                        log.info("Subscription activated for org={}, plan={}", sub.getOrganizationId(), record.getPlanName());
                    });
                }
                case "canceled" -> {
                    record.setPaymentStatus(PaymentStatus.CANCELLED);
                    billingRecordRepository.save(record);
                    log.info("Payment cancelled for billingRecordId={}", record.getId());
                }
                default -> log.info("YooKassa webhook: unhandled status={}", status);
            }
        } catch (Exception e) {
            log.error("YooKassa webhook processing error: {}", e.getMessage(), e);
        }

        // Always return 200 to YooKassa
        return ResponseEntity.ok().build();
    }

    private boolean verifyHmacSignature(String body, String signature, String secret) {
        if (signature == null || signature.isBlank()) return false;
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            String computed = java.util.Base64.getEncoder().encodeToString(hash);
            return java.security.MessageDigest.isEqual(computed.getBytes(), signature.getBytes());
        } catch (Exception e) {
            return false;
        }
    }
}
