package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.finance.domain.PaymentStatus;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.finance.web.dto.CreatePaymentRequest;
import com.privod.platform.modules.finance.web.dto.PaymentResponse;
import com.privod.platform.modules.finance.web.dto.PaymentSummaryResponse;
import com.privod.platform.modules.finance.web.dto.UpdatePaymentRequest;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PaymentResponse> listPayments(UUID projectId, PaymentStatus status,
                                               PaymentType paymentType, Pageable pageable) {
        Page<Payment> page;
        if (projectId != null) {
            page = paymentRepository.findByProjectIdAndDeletedFalse(projectId, pageable);
        } else if (status != null) {
            page = paymentRepository.findByStatusAndDeletedFalse(status, pageable);
        } else {
            page = paymentRepository.findAll(pageable);
        }
        return enrichPaymentsWithProjectName(page);
    }

    /**
     * Batch-resolve project names for a page of payments to avoid N+1 queries.
     */
    private Page<PaymentResponse> enrichPaymentsWithProjectName(Page<Payment> page) {
        List<UUID> projectIds = page.getContent().stream()
                .map(Payment::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<UUID, String> projectNameMap = resolveProjectNames(projectIds);

        List<PaymentResponse> enriched = page.getContent().stream()
                .map(payment -> PaymentResponse.fromEntity(
                        payment,
                        payment.getProjectId() != null ? projectNameMap.get(payment.getProjectId()) : null))
                .toList();

        return new PageImpl<>(enriched, page.getPageable(), page.getTotalElements());
    }

    private Map<UUID, String> resolveProjectNames(List<UUID> projectIds) {
        if (projectIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> map = new HashMap<>();
        for (Object[] row : projectRepository.findNamesByIds(projectIds)) {
            map.put((UUID) row[0], (String) row[1]);
        }
        return map;
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID id) {
        Payment payment = getPaymentOrThrow(id);
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        String number = generatePaymentNumber();

        BigDecimal amount = request.amount();
        BigDecimal vatAmount = request.vatAmount() != null ? request.vatAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = amount.add(vatAmount);

        // Auto-resolve projectId and partner info from contract if not explicitly provided
        UUID projectId = request.projectId();
        UUID partnerId = request.partnerId();
        String partnerName = request.partnerName();
        if (request.contractId() != null) {
            Contract contract = contractRepository.findById(request.contractId())
                    .filter(c -> !c.isDeleted())
                    .orElse(null);
            if (contract != null) {
                if (projectId == null && contract.getProjectId() != null) {
                    projectId = contract.getProjectId();
                }
                if (partnerId == null && contract.getPartnerId() != null) {
                    partnerId = contract.getPartnerId();
                }
                if (partnerName == null && contract.getPartnerName() != null) {
                    partnerName = contract.getPartnerName();
                }
            }
        }

        Payment payment = Payment.builder()
                .number(number)
                .paymentDate(request.paymentDate())
                .projectId(projectId)
                .contractId(request.contractId())
                .partnerId(partnerId)
                .partnerName(partnerName)
                .paymentType(request.paymentType())
                .status(PaymentStatus.DRAFT)
                .amount(amount)
                .vatAmount(vatAmount)
                .totalAmount(totalAmount)
                .purpose(request.purpose())
                .bankAccount(request.bankAccount())
                .invoiceId(request.invoiceId())
                .notes(request.notes())
                .build();

        payment = paymentRepository.save(payment);
        auditService.logCreate("Payment", payment.getId());

        log.info("Платёж создан: {} - {} ({})", payment.getNumber(),
                payment.getPaymentType().getDisplayName(), payment.getId());
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentResponse updatePayment(UUID id, UpdatePaymentRequest request) {
        Payment payment = getPaymentOrThrow(id);

        if (payment.getStatus() != PaymentStatus.DRAFT) {
            throw new IllegalStateException("Редактирование платежа возможно только в статусе Черновик");
        }

        if (request.paymentDate() != null) {
            payment.setPaymentDate(request.paymentDate());
        }
        if (request.projectId() != null) {
            payment.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            payment.setContractId(request.contractId());
        }
        if (request.partnerId() != null) {
            payment.setPartnerId(request.partnerId());
        }
        if (request.partnerName() != null) {
            payment.setPartnerName(request.partnerName());
        }
        if (request.amount() != null) {
            payment.setAmount(request.amount());
        }
        if (request.vatAmount() != null) {
            payment.setVatAmount(request.vatAmount());
        }
        if (request.purpose() != null) {
            payment.setPurpose(request.purpose());
        }
        if (request.bankAccount() != null) {
            payment.setBankAccount(request.bankAccount());
        }
        if (request.invoiceId() != null) {
            payment.setInvoiceId(request.invoiceId());
        }
        if (request.notes() != null) {
            payment.setNotes(request.notes());
        }

        // Recalculate total
        payment.setTotalAmount(payment.calculateTotalAmount());

        payment = paymentRepository.save(payment);
        auditService.logUpdate("Payment", payment.getId(), "multiple", null, null);

        log.info("Платёж обновлён: {} ({})", payment.getNumber(), payment.getId());
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentResponse approvePayment(UUID id) {
        Payment payment = getPaymentOrThrow(id);
        PaymentStatus oldStatus = payment.getStatus();

        if (!payment.canTransitionTo(PaymentStatus.APPROVED)) {
            throw new IllegalStateException(
                    String.format("Невозможно утвердить платёж из статуса %s", oldStatus.getDisplayName()));
        }

        payment.setStatus(PaymentStatus.APPROVED);
        payment.setApprovedAt(Instant.now());
        payment = paymentRepository.save(payment);
        auditService.logStatusChange("Payment", payment.getId(), oldStatus.name(), PaymentStatus.APPROVED.name());

        log.info("Платёж утверждён: {} ({})", payment.getNumber(), payment.getId());
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentResponse markPaid(UUID id) {
        Payment payment = getPaymentOrThrow(id);
        PaymentStatus oldStatus = payment.getStatus();

        if (!payment.canTransitionTo(PaymentStatus.PAID)) {
            throw new IllegalStateException(
                    String.format("Невозможно отметить платёж как оплаченный из статуса %s",
                            oldStatus.getDisplayName()));
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        payment = paymentRepository.save(payment);
        auditService.logStatusChange("Payment", payment.getId(), oldStatus.name(), PaymentStatus.PAID.name());

        log.info("Платёж оплачен: {} ({})", payment.getNumber(), payment.getId());
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentResponse cancelPayment(UUID id) {
        Payment payment = getPaymentOrThrow(id);
        PaymentStatus oldStatus = payment.getStatus();

        if (!payment.canTransitionTo(PaymentStatus.CANCELLED)) {
            throw new IllegalStateException(
                    String.format("Невозможно отменить платёж из статуса %s", oldStatus.getDisplayName()));
        }

        payment.setStatus(PaymentStatus.CANCELLED);
        payment = paymentRepository.save(payment);
        auditService.logStatusChange("Payment", payment.getId(), oldStatus.name(), PaymentStatus.CANCELLED.name());

        log.info("Платёж отменён: {} ({})", payment.getNumber(), payment.getId());
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional(readOnly = true)
    public PaymentSummaryResponse getProjectPaymentSummary(UUID projectId) {
        long totalPayments = paymentRepository.countByProjectIdAndDeletedFalse(projectId);
        BigDecimal totalIncoming = paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.INCOMING);
        BigDecimal totalOutgoing = paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.OUTGOING);

        BigDecimal incoming = totalIncoming != null ? totalIncoming : BigDecimal.ZERO;
        BigDecimal outgoing = totalOutgoing != null ? totalOutgoing : BigDecimal.ZERO;

        return new PaymentSummaryResponse(
                totalPayments,
                incoming,
                outgoing,
                incoming.subtract(outgoing)
        );
    }

    private Payment getPaymentOrThrow(UUID id) {
        return paymentRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Платёж не найден: " + id));
    }

    private String generatePaymentNumber() {
        long seq = paymentRepository.getNextNumberSequence();
        return String.format("PAY-%05d", seq);
    }
}
