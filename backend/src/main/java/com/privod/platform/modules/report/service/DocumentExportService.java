package com.privod.platform.modules.report.service;

import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks2Line;
import com.privod.platform.modules.closing.domain.Ks3Document;
import com.privod.platform.modules.closing.domain.Ks3Ks2Link;
import com.privod.platform.modules.closing.repository.Ks2DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks2LineRepository;
import com.privod.platform.modules.closing.repository.Ks3DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks3Ks2LinkRepository;
import com.privod.platform.modules.commercialProposal.domain.CommercialProposal;
import com.privod.platform.modules.commercialProposal.domain.CommercialProposalItem;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalItemRepository;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalRepository;
import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.estimate.repository.EstimateRepository;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.report.web.dto.CpExportResponse;
import com.privod.platform.modules.report.web.dto.EstimateExportResponse;
import com.privod.platform.modules.report.web.dto.InvoiceExportResponse;
import com.privod.platform.modules.report.web.dto.Ks2ExportResponse;
import com.privod.platform.modules.report.web.dto.Ks3ExportResponse;
import com.privod.platform.infrastructure.finance.VatCalculator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final Ks3DocumentRepository ks3DocumentRepository;
    private final Ks3Ks2LinkRepository ks3Ks2LinkRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProjectRepository projectRepository;
    private final CommercialProposalRepository commercialProposalRepository;
    private final CommercialProposalItemRepository commercialProposalItemRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final BigDecimal DEFAULT_VAT_RATE = VatCalculator.DEFAULT_RATE;

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
        BigDecimal vatAmount = VatCalculator.vatAmount(totalAmount, DEFAULT_VAT_RATE);
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
    // KS-3 Export
    // =========================================================================

    @Transactional(readOnly = true)
    public Ks3ExportResponse getKs3ExportData(UUID ks3Id) {
        Ks3Document doc = ks3DocumentRepository.findById(ks3Id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("KS-3 document not found: " + ks3Id));

        String projectName = resolveProjectName(doc.getProjectId());

        // Resolve linked KS-2 documents
        List<Ks3Ks2Link> links = ks3Ks2LinkRepository.findByKs3IdAndDeletedFalse(ks3Id);
        List<Ks3ExportResponse.LinkedKs2Item> linkedKs2 = links.stream()
                .map(link -> ks2DocumentRepository.findById(link.getKs2Id())
                        .filter(k -> !k.isDeleted())
                        .map(ks2 -> new Ks3ExportResponse.LinkedKs2Item(
                                ks2.getId(),
                                ks2.getNumber(),
                                ks2.getName(),
                                ks2.getDocumentDate() != null ? ks2.getDocumentDate().format(DATE_FMT) : "",
                                ks2.getTotalAmount()
                        ))
                        .orElse(null))
                .filter(item -> item != null)
                .toList();

        log.info("KS-3 export data prepared: {} ({} linked KS-2)", doc.getNumber(), linkedKs2.size());

        return new Ks3ExportResponse(
                doc.getId(),
                doc.getNumber(),
                doc.getDocumentDate() != null ? doc.getDocumentDate().format(DATE_FMT) : "",
                doc.getName(),
                doc.getPeriodFrom() != null ? doc.getPeriodFrom().format(DATE_FMT) : "",
                doc.getPeriodTo() != null ? doc.getPeriodTo().format(DATE_FMT) : "",
                projectName,
                null, // contractorName — resolved from org profile (not on entity)
                null, // clientName — resolved from counterparty if contractId present
                doc.getStatus().name(),
                doc.getStatus().getDisplayName(),
                doc.getTotalAmount(),
                doc.getRetentionPercent(),
                doc.getRetentionAmount(),
                doc.getNetAmount(),
                doc.getNotes(),
                doc.getCreatedBy(),
                doc.getCreatedAt() != null ? doc.getCreatedAt().toString() : null,
                linkedKs2
        );
    }

    // =========================================================================
    // Commercial Proposal (КП) Export
    // =========================================================================

    @Transactional(readOnly = true)
    public CpExportResponse getCpExportData(UUID cpId) {
        CommercialProposal cp = commercialProposalRepository.findByIdAndDeletedFalse(cpId)
                .orElseThrow(() -> new EntityNotFoundException("Commercial proposal not found: " + cpId));

        List<CommercialProposalItem> items = commercialProposalItemRepository.findByProposalId(cpId);

        // Resolve BudgetItem names for display
        List<UUID> budgetItemIds = items.stream()
                .map(CommercialProposalItem::getBudgetItemId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, BudgetItem> budgetItemMap = budgetItemIds.isEmpty()
                ? Map.of()
                : budgetItemRepository.findAllById(budgetItemIds).stream()
                        .collect(Collectors.toMap(BudgetItem::getId, Function.identity()));

        String projectName = resolveProjectName(cp.getProjectId());
        String budgetName = budgetRepository.findByIdAndDeletedFalse(cp.getBudgetId())
                .map(Budget::getName)
                .orElse("");

        AtomicInteger rowNum = new AtomicInteger(1);
        List<CpExportResponse.CpExportItem> materialItems = items.stream()
                .filter(i -> "MATERIAL".equalsIgnoreCase(i.getItemType()))
                .map(i -> toCpExportItem(i, budgetItemMap, rowNum.getAndIncrement()))
                .collect(Collectors.toList());

        AtomicInteger workRowNum = new AtomicInteger(1);
        List<CpExportResponse.CpExportItem> workItems = items.stream()
                .filter(i -> !"MATERIAL".equalsIgnoreCase(i.getItemType()))
                .map(i -> toCpExportItem(i, budgetItemMap, workRowNum.getAndIncrement()))
                .collect(Collectors.toList());

        log.info("КП export data prepared: {} ({} material, {} work items)",
                cp.getName(), materialItems.size(), workItems.size());

        return new CpExportResponse(
                cp.getId().toString(),
                cp.getName(),
                projectName,
                budgetName,
                cp.getStatus().name(),
                cp.getStatus().getDisplayName(),
                cp.getCompanyName(),
                cp.getCompanyInn(),
                cp.getCompanyKpp(),
                cp.getCompanyAddress(),
                cp.getSignatoryName(),
                cp.getSignatoryPosition(),
                cp.getCreatedAt() != null ? cp.getCreatedAt().toString() : null,
                cp.getApprovedAt() != null ? cp.getApprovedAt().toString() : null,
                cp.getNotes(),
                cp.getTotalCostPrice(),
                cp.getTotalCustomerPrice(),
                cp.getTotalMargin(),
                cp.getMarginPercent(),
                materialItems,
                workItems
        );
    }

    private CpExportResponse.CpExportItem toCpExportItem(
            CommercialProposalItem item,
            Map<UUID, BudgetItem> budgetItemMap,
            int rowNumber) {

        String name = item.getBudgetItemId() != null && budgetItemMap.containsKey(item.getBudgetItemId())
                ? budgetItemMap.get(item.getBudgetItemId()).getName()
                : (item.getVendorName() != null ? item.getVendorName() : "");

        BigDecimal qty      = item.getQuantity()   != null ? item.getQuantity()   : BigDecimal.ONE;
        BigDecimal costPr   = item.getCostPrice()  != null ? item.getCostPrice()  : BigDecimal.ZERO;
        BigDecimal unitPr   = item.getUnitPrice()  != null ? item.getUnitPrice()  : BigDecimal.ZERO;
        BigDecimal totalCst = item.getTotalCost()  != null ? item.getTotalCost()  : BigDecimal.ZERO;
        BigDecimal totalCus = unitPr.multiply(qty).setScale(2, RoundingMode.HALF_UP);

        return new CpExportResponse.CpExportItem(
                rowNumber,
                name,
                item.getUnit(),
                qty,
                costPr,
                unitPr,
                totalCst,
                totalCus,
                item.getNotes(),
                item.getStatus() != null ? item.getStatus().name() : null
        );
    }

    // =========================================================================
    // Supported Document Types Registry
    // =========================================================================

    /**
     * Returns the list of all document types this service can export/render.
     * Mirrors the print templates available in the frontend PrintTemplates directory.
     */
    public List<String> getSupportedDocumentTypes() {
        return List.of(
                "KS2",       // КС-2 Акт о приёмке выполненных работ (/api/export/ks2/{id}/data)
                "KS3",       // КС-3 Справка о стоимости (/api/export/ks3/{id}/data)
                "ESTIMATE",  // Смета (/api/export/estimate/{id}/data)
                "INVOICE",   // Счёт на оплату (/api/export/invoice/{id}/data)
                "CP"         // Коммерческое предложение (/api/export/cp/{id}/data)
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
