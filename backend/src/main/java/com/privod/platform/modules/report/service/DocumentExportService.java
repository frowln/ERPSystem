package com.privod.platform.modules.report.service;

import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks2Line;
import com.privod.platform.modules.closing.repository.Ks2DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks2LineRepository;
import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.estimate.repository.EstimateRepository;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.report.web.dto.EstimateExportResponse;
import com.privod.platform.modules.report.web.dto.InvoiceExportResponse;
import com.privod.platform.modules.report.web.dto.Ks2ExportResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for preparing structured export data for construction documents.
 * Returns DTOs suitable for frontend-side PDF/print rendering.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentExportService {

    private final Ks2DocumentRepository ks2DocumentRepository;
    private final Ks2LineRepository ks2LineRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProjectRepository projectRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final BigDecimal DEFAULT_VAT_RATE = new BigDecimal("20");

    // =========================================================================
    // KS-2 Export
    // =========================================================================

    @Transactional(readOnly = true)
    public Ks2ExportResponse getKs2ExportData(UUID ks2Id) {
        Ks2Document doc = ks2DocumentRepository.findById(ks2Id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("KS-2 document not found: " + ks2Id));

        List<Ks2Line> lines = ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id);

        String projectName = resolveProjectName(doc.getProjectId());

        AtomicInteger rowNum = new AtomicInteger(1);
        List<Ks2ExportResponse.Ks2ExportLineItem> exportLines = lines.stream()
                .map(line -> new Ks2ExportResponse.Ks2ExportLineItem(
                        rowNum.getAndIncrement(),
                        line.getName(),
                        line.getUnitOfMeasure(),
                        line.getQuantity(),
                        line.getUnitPrice(),
                        line.getAmount()
                ))
                .toList();

        BigDecimal totalAmount = doc.getTotalAmount() != null ? doc.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal vatAmount = totalAmount.multiply(DEFAULT_VAT_RATE)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal totalWithVat = totalAmount.add(vatAmount);

        log.info("KS-2 export data prepared: {} ({} lines)", doc.getName(), exportLines.size());

        return new Ks2ExportResponse(
                doc.getNumber(),
                doc.getDocumentDate() != null ? doc.getDocumentDate().format(DATE_FMT) : "",
                projectName,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                projectName,
                null,
                null,
                exportLines,
                totalAmount,
                DEFAULT_VAT_RATE,
                vatAmount,
                totalWithVat,
                doc.getStatus().name(),
                doc.getStatus().getDisplayName(),
                doc.getCreatedBy(),
                null,
                doc.getSignedAt() != null ? doc.getSignedAt().toString() : null,
                doc.getNotes()
        );
    }

    // =========================================================================
    // Estimate Export
    // =========================================================================

    @Transactional(readOnly = true)
    public EstimateExportResponse getEstimateExportData(UUID estimateId) {
        Estimate estimate = estimateRepository.findById(estimateId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Estimate not found: " + estimateId));

        List<EstimateItem> items = estimateItemRepository.findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimateId);

        String projectName = resolveProjectName(estimate.getProjectId());

        AtomicInteger rowNum = new AtomicInteger(1);
        List<EstimateExportResponse.EstimateExportItem> exportItems = items.stream()
                .map(item -> new EstimateExportResponse.EstimateExportItem(
                        rowNum.getAndIncrement(),
                        item.getName(),
                        item.getUnitOfMeasure(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getAmount(),
                        item.getUnitPriceCustomer(),
                        item.getAmountCustomer(),
                        item.getOrderedAmount(),
                        item.getInvoicedAmount()
                ))
                .toList();

        log.info("Estimate export data prepared: {} ({} items)", estimate.getName(), exportItems.size());

        return new EstimateExportResponse(
                estimate.getId().toString(),
                estimate.getName(),
                projectName,
                null,
                estimate.getStatus().name(),
                estimate.getStatus().getDisplayName(),
                estimate.getTotalAmount(),
                estimate.getOrderedAmount(),
                estimate.getInvoicedAmount(),
                estimate.getTotalSpent(),
                estimate.getBalance(),
                estimate.getCreatedBy(),
                estimate.getCreatedAt() != null ? estimate.getCreatedAt().toString() : null,
                estimate.getNotes(),
                exportItems
        );
    }

    // =========================================================================
    // Invoice Export
    // =========================================================================

    @Transactional(readOnly = true)
    public InvoiceExportResponse getInvoiceExportData(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndDeletedFalse(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceId));

        String projectName = resolveProjectName(invoice.getProjectId());

        log.info("Invoice export data prepared: {} ({})", invoice.getNumber(), invoiceId);

        return new InvoiceExportResponse(
                invoice.getId().toString(),
                invoice.getNumber(),
                invoice.getInvoiceDate() != null ? invoice.getInvoiceDate().format(DATE_FMT) : "",
                invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : "",
                projectName,
                invoice.getPartnerName(),
                invoice.getInvoiceType() != null ? invoice.getInvoiceType().name() : null,
                invoice.getInvoiceType() != null ? invoice.getInvoiceType().getDisplayName() : null,
                invoice.getStatus() != null ? invoice.getStatus().name() : null,
                invoice.getStatus() != null ? invoice.getStatus().getDisplayName() : null,
                invoice.getSubtotal(),
                invoice.getVatRate(),
                invoice.getVatAmount(),
                invoice.getTotalAmount(),
                invoice.getPaidAmount(),
                invoice.getRemainingAmount(),
                invoice.isOverdue(),
                invoice.getNotes(),
                invoice.getCreatedBy(),
                invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : null
        );
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private String resolveProjectName(UUID projectId) {
        if (projectId == null) return "";
        return projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .map(Project::getName)
                .orElse("");
    }
}
