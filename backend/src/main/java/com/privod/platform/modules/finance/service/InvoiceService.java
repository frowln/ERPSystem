package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.finance.VatCalculator;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceLine;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.finance.web.dto.CreateInvoiceLineRequest;
import com.privod.platform.modules.finance.web.dto.CreateInvoiceRequest;
import com.privod.platform.modules.finance.web.dto.InvoiceLineResponse;
import com.privod.platform.modules.finance.web.dto.PaymentResponse;
import com.privod.platform.modules.finance.web.dto.InvoiceResponse;
import com.privod.platform.modules.finance.web.dto.InvoiceSummaryResponse;
import com.privod.platform.modules.finance.web.dto.UpdateInvoiceRequest;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineRepository invoiceLineRepository;
    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    private final BudgetItemSyncService budgetItemSyncService;
    private final CashFlowService cashFlowService;

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> listInvoices(UUID projectId, InvoiceStatus status,
                                               InvoiceType invoiceType, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Page<Invoice> page;
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            page = invoiceRepository.findByProjectIdAndDeletedFalse(projectId, pageable);
        } else if (status != null) {
            List<UUID> projectIds = getOrganizationProjectIds(organizationId);
            if (projectIds.isEmpty()) {
                return Page.empty(pageable);
            }
            page = invoiceRepository.findByProjectIdInAndStatusAndDeletedFalse(projectIds, status, pageable);
        } else {
            List<UUID> projectIds = getOrganizationProjectIds(organizationId);
            if (projectIds.isEmpty()) {
                return Page.empty(pageable);
            }
            page = invoiceRepository.findByProjectIdInAndDeletedFalse(projectIds, pageable);
        }
        return enrichInvoicesWithProjectName(page);
    }

    /**
     * Batch-resolve project names for a page of invoices to avoid N+1 queries.
     */
    private Page<InvoiceResponse> enrichInvoicesWithProjectName(Page<Invoice> page) {
        List<UUID> projectIds = page.getContent().stream()
                .map(Invoice::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<UUID, String> projectNameMap = resolveProjectNames(projectIds);

        List<InvoiceResponse> enriched = page.getContent().stream()
                .map(invoice -> InvoiceResponse.fromEntity(
                        invoice,
                        invoice.getProjectId() != null ? projectNameMap.get(invoice.getProjectId()) : null))
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
    public InvoiceResponse getInvoice(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Invoice invoice = getInvoiceOrThrow(id, organizationId);
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String number = generateInvoiceNumber();

        BigDecimal vatRate = VatCalculator.resolveRate(request.vatRate());
        BigDecimal subtotal = request.subtotal();
        BigDecimal vatAmount;
        BigDecimal totalAmount = request.totalAmount();

        if (subtotal != null) {
            vatAmount = VatCalculator.vatAmount(subtotal, vatRate);
        } else {
            vatAmount = BigDecimal.ZERO;
        }

        // Auto-resolve projectId from contract if not explicitly provided
        UUID projectId = request.projectId();
        UUID partnerId = request.partnerId();
        String partnerName = request.partnerName();
        if (request.contractId() != null) {
            Contract contract = contractRepository.findByIdAndOrganizationIdAndDeletedFalse(request.contractId(), organizationId)
                    .orElseThrow(() -> new EntityNotFoundException("Договор не найден: " + request.contractId()));
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

        if (projectId == null) {
            throw new IllegalArgumentException("Проект обязателен для счёта");
        }
        validateProjectTenant(projectId, organizationId);

        UUID effectiveContractId = request.contractId();
        Invoice invoice = Invoice.builder()
                .organizationId(organizationId)
                .number(number)
                .invoiceDate(request.invoiceDate())
                .dueDate(request.dueDate())
                .projectId(projectId)
                .contractId(effectiveContractId)
                .partnerId(partnerId)
                .partnerName(partnerName)
                .disciplineMark(request.disciplineMark())
                .invoiceType(request.invoiceType())
                .status(InvoiceStatus.NEW)
                .subtotal(subtotal)
                .vatRate(vatRate)
                .vatAmount(vatAmount)
                .totalAmount(totalAmount)
                .remainingAmount(totalAmount)
                .ks2Id(request.ks2Id())
                .ks3Id(request.ks3Id())
                .matchedPoId(effectiveContractId)
                .matchedReceiptId(request.ks2Id() != null ? request.ks2Id() : request.ks3Id())
                .notes(request.notes())
                .budgetItemId(request.budgetItemId())
                .build();

        invoice = invoiceRepository.save(invoice);
        auditService.logCreate("Invoice", invoice.getId());

        log.info("Счёт создан: {} - {} ({})", invoice.getNumber(),
                invoice.getInvoiceType().getDisplayName(), invoice.getId());
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse updateInvoice(UUID id, UpdateInvoiceRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Invoice invoice = getInvoiceOrThrow(id, organizationId);
        UUID oldContractId = invoice.getContractId();

        if (invoice.getStatus() != InvoiceStatus.NEW && invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Редактирование счёта возможно только в статусе Новый/Черновик");
        }

        if (request.invoiceDate() != null) {
            invoice.setInvoiceDate(request.invoiceDate());
        }
        if (request.dueDate() != null) {
            invoice.setDueDate(request.dueDate());
        }
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            invoice.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            contractRepository.findByIdAndOrganizationIdAndDeletedFalse(request.contractId(), organizationId)
                    .orElseThrow(() -> new EntityNotFoundException("Договор не найден: " + request.contractId()));
            invoice.setContractId(request.contractId());
        }
        if (request.partnerId() != null) {
            invoice.setPartnerId(request.partnerId());
        }
        if (request.partnerName() != null) {
            invoice.setPartnerName(request.partnerName());
        }
        if (request.disciplineMark() != null) {
            invoice.setDisciplineMark(request.disciplineMark());
        }
        if (request.subtotal() != null) {
            invoice.setSubtotal(request.subtotal());
        }
        if (request.vatRate() != null) {
            invoice.setVatRate(request.vatRate());
        }
        if (request.totalAmount() != null) {
            invoice.setTotalAmount(request.totalAmount());
        }
        if (request.ks2Id() != null) {
            invoice.setKs2Id(request.ks2Id());
        }
        if (request.ks3Id() != null) {
            invoice.setKs3Id(request.ks3Id());
        }
        if (request.notes() != null) {
            invoice.setNotes(request.notes());
        }
        if (request.budgetItemId() != null) {
            invoice.setBudgetItemId(request.budgetItemId());
        }

        // Keep 3-way references synchronized with core document links.
        invoice.setMatchedPoId(invoice.getContractId());
        invoice.setMatchedReceiptId(invoice.getKs2Id() != null ? invoice.getKs2Id() : invoice.getKs3Id());

        // Recalculate VAT amount
        if (invoice.getSubtotal() != null && invoice.getVatRate() != null) {
            invoice.setVatAmount(VatCalculator.vatAmount(invoice.getSubtotal(), invoice.getVatRate()));
        }

        // Recalculate remaining
        invoice.setRemainingAmount(invoice.calculateRemainingAmount());

        invoice = invoiceRepository.save(invoice);
        if (!Objects.equals(oldContractId, invoice.getContractId())) {
            budgetItemSyncService.onInvoiceContractChanged(oldContractId, invoice.getContractId());
        } else {
            budgetItemSyncService.onInvoiceFinancialStateChanged(invoice.getContractId());
        }
        auditService.logUpdate("Invoice", invoice.getId(), "multiple", null, null);

        log.info("Счёт обновлён: {} ({})", invoice.getNumber(), invoice.getId());
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse sendInvoice(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Invoice invoice = getInvoiceOrThrow(id, organizationId);
        InvoiceStatus oldStatus = invoice.getStatus();

        if (!invoice.getStatus().canTransitionTo(InvoiceStatus.UNDER_REVIEW)) {
            throw new IllegalStateException(
                    String.format("Невозможно отправить счёт из статуса %s", oldStatus.getDisplayName()));
        }

        invoice.setStatus(InvoiceStatus.UNDER_REVIEW);
        invoice = invoiceRepository.save(invoice);
        budgetItemSyncService.onInvoiceFinancialStateChanged(invoice.getContractId());
        auditService.logStatusChange("Invoice", invoice.getId(), oldStatus.name(), InvoiceStatus.UNDER_REVIEW.name());

        log.info("Счёт отправлен: {} ({})", invoice.getNumber(), invoice.getId());
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse registerPayment(UUID id, BigDecimal amount) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Invoice invoice = getInvoiceOrThrow(id, organizationId);

        if (invoice.getStatus() == InvoiceStatus.NEW
                || invoice.getStatus() == InvoiceStatus.DRAFT
                || invoice.getStatus() == InvoiceStatus.PAID
                || invoice.getStatus() == InvoiceStatus.CLOSED
                || invoice.getStatus() == InvoiceStatus.REJECTED
                || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException(
                    String.format("Невозможно зарегистрировать оплату для счёта в статусе %s",
                            invoice.getStatus().getDisplayName()));
        }

        BigDecimal remaining = invoice.calculateRemainingAmount();
        if (amount.compareTo(remaining) > 0) {
            throw new IllegalArgumentException(
                    String.format("Сумма оплаты (%s) превышает остаток по счёту (%s)", amount, remaining));
        }

        BigDecimal newPaidAmount = (invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO)
                .add(amount);
        invoice.setPaidAmount(newPaidAmount);
        invoice.setRemainingAmount(invoice.calculateRemainingAmount());

        InvoiceStatus oldStatus = invoice.getStatus();
        if (invoice.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoice = invoiceRepository.save(invoice);
        budgetItemSyncService.onPaymentFinancialStateChanged(invoice.getContractId());

        if (oldStatus != invoice.getStatus()) {
            auditService.logStatusChange("Invoice", invoice.getId(), oldStatus.name(), invoice.getStatus().name());
        }

        // P1-CHN-2: Auto-create CashFlowEntry when invoice becomes fully PAID
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            UUID orgId = SecurityUtils.requireCurrentOrganizationId();
            cashFlowService.createFromInvoicePaid(
                    invoice.getId(), invoice.getProjectId(),
                    invoice.getTotalAmount(),
                    "Оплата счёта " + invoice.getNumber(),
                    orgId);
        }

        log.info("Оплата зарегистрирована для счёта {}: {} ({})", invoice.getNumber(), amount, invoice.getId());
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse markOverdue(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Invoice invoice = getInvoiceOrThrow(id, organizationId);
        InvoiceStatus oldStatus = invoice.getStatus();

        if (!invoice.getStatus().canTransitionTo(InvoiceStatus.OVERDUE)) {
            throw new IllegalStateException(
                    String.format("Невозможно отметить счёт как просроченный из статуса %s",
                            oldStatus.getDisplayName()));
        }

        invoice.setStatus(InvoiceStatus.OVERDUE);
        invoice = invoiceRepository.save(invoice);
        budgetItemSyncService.onInvoiceFinancialStateChanged(invoice.getContractId());
        auditService.logStatusChange("Invoice", invoice.getId(), oldStatus.name(), InvoiceStatus.OVERDUE.name());

        log.info("Счёт отмечен как просроченный: {} ({})", invoice.getNumber(), invoice.getId());
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse cancelInvoice(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Invoice invoice = getInvoiceOrThrow(id, organizationId);
        InvoiceStatus oldStatus = invoice.getStatus();

        InvoiceStatus targetStatus = invoice.getStatus().canTransitionTo(InvoiceStatus.REJECTED)
                ? InvoiceStatus.REJECTED
                : InvoiceStatus.CANCELLED;

        if (!invoice.getStatus().canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно отменить счёт из статуса %s", oldStatus.getDisplayName()));
        }

        invoice.setStatus(targetStatus);
        invoice = invoiceRepository.save(invoice);
        budgetItemSyncService.onInvoiceFinancialStateChanged(invoice.getContractId());
        auditService.logStatusChange("Invoice", invoice.getId(), oldStatus.name(), targetStatus.name());

        log.info("Счёт отменён: {} ({})", invoice.getNumber(), invoice.getId());
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse changeStatus(UUID id, InvoiceStatus targetStatus) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Invoice invoice = getInvoiceOrThrow(id, organizationId);
        InvoiceStatus oldStatus = invoice.getStatus();

        if (!oldStatus.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести счёт из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        invoice.setStatus(targetStatus);
        invoice = invoiceRepository.save(invoice);
        budgetItemSyncService.onInvoiceFinancialStateChanged(invoice.getContractId());

        // P1-CHN-2: Auto-create CashFlowEntry when manually transitioned to PAID
        if (targetStatus == InvoiceStatus.PAID) {
            UUID orgId = SecurityUtils.requireCurrentOrganizationId();
            cashFlowService.createFromInvoicePaid(
                    invoice.getId(), invoice.getProjectId(),
                    invoice.getTotalAmount(),
                    "Оплата счёта " + invoice.getNumber(),
                    orgId);
        }

        auditService.logStatusChange("Invoice", invoice.getId(), oldStatus.name(), targetStatus.name());
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceSummaryResponse getProjectInvoiceSummary(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        long totalInvoices = invoiceRepository.countByProjectIdAndDeletedFalse(projectId);
        BigDecimal totalIssued = invoiceRepository.sumTotalByProjectIdAndType(projectId, InvoiceType.ISSUED);
        BigDecimal totalReceived = invoiceRepository.sumTotalByProjectIdAndType(projectId, InvoiceType.RECEIVED);
        long overdueCount = invoiceRepository.countOverdueByProjectId(projectId);
        BigDecimal overdueAmount = invoiceRepository.sumOverdueAmountByProjectId(projectId);

        return new InvoiceSummaryResponse(
                totalInvoices,
                totalIssued != null ? totalIssued : BigDecimal.ZERO,
                totalReceived != null ? totalReceived : BigDecimal.ZERO,
                overdueCount,
                overdueAmount != null ? overdueAmount : BigDecimal.ZERO
        );
    }

    // === Invoice Lines ===

    @Transactional(readOnly = true)
    public List<InvoiceLineResponse> getInvoiceLines(UUID invoiceId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getInvoiceOrThrow(invoiceId, organizationId);
        return invoiceLineRepository.findByInvoiceIdAndDeletedFalseOrderBySequenceAsc(invoiceId)
                .stream()
                .map(InvoiceLineResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getInvoicePayments(UUID invoiceId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getInvoiceOrThrow(invoiceId, organizationId);
        return paymentRepository.findByInvoiceIdAndDeletedFalse(invoiceId)
                .stream()
                .map(PaymentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public InvoiceLineResponse addInvoiceLine(UUID invoiceId, CreateInvoiceLineRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getInvoiceOrThrow(invoiceId, organizationId);

        InvoiceLine line = InvoiceLine.builder()
                .invoiceId(invoiceId)
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .name(request.name())
                .quantity(request.quantity())
                .unitPrice(request.unitPrice())
                .unitOfMeasure(request.unitOfMeasure())
                .build();

        line.setAmount(line.calculateAmount());
        line = invoiceLineRepository.save(line);
        auditService.logCreate("InvoiceLine", line.getId());

        log.info("Строка счёта добавлена: {} в счёт {}", line.getName(), invoiceId);
        return InvoiceLineResponse.fromEntity(line);
    }

    @Transactional
    public InvoiceLineResponse linkInvoiceLine(UUID invoiceId, UUID lineId, com.privod.platform.modules.finance.web.dto.LinkInvoiceLineRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getInvoiceOrThrow(invoiceId, organizationId);
        InvoiceLine line = invoiceLineRepository.findById(lineId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка счёта не найдена: " + lineId));

        if (!line.getInvoiceId().equals(invoiceId)) {
            throw new IllegalArgumentException("Строка не принадлежит указанному счёту");
        }

        line.setBudgetItemId(request.budgetItemId());
        line.setCpItemId(request.cpItemId());
        line = invoiceLineRepository.save(line);
        auditService.logUpdate("InvoiceLine", line.getId(), "link", null, null);

        log.info("Строка счёта {} обновлена привязка (ФМ: {})", lineId, request.budgetItemId());
        return InvoiceLineResponse.fromEntity(line);
    }

    @Transactional
    public void deleteInvoiceLine(UUID invoiceId, UUID lineId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getInvoiceOrThrow(invoiceId, organizationId);
        InvoiceLine line = invoiceLineRepository.findById(lineId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка счёта не найдена: " + lineId));

        if (!line.getInvoiceId().equals(invoiceId)) {
            throw new IllegalArgumentException("Строка не принадлежит указанному счёту");
        }

        line.softDelete();
        invoiceLineRepository.save(line);
        auditService.logDelete("InvoiceLine", lineId);

        log.info("Строка счёта удалена: {} из счёта {}", lineId, invoiceId);
    }

    private Invoice getInvoiceOrThrow(UUID id, UUID organizationId) {
        Invoice invoice = invoiceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Счёт не найден: " + id));
        validateProjectTenant(invoice.getProjectId(), organizationId);
        return invoice;
    }

    private List<UUID> getOrganizationProjectIds(UUID organizationId) {
        return projectRepository.findAllIdsByOrganizationIdAndDeletedFalse(organizationId);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            throw new EntityNotFoundException("Проект не найден: null");
        }
        projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .filter(p -> organizationId.equals(p.getOrganizationId()))
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }

    private String generateInvoiceNumber() {
        long seq = invoiceRepository.getNextNumberSequence();
        return String.format("INV-%05d", seq);
    }
}
