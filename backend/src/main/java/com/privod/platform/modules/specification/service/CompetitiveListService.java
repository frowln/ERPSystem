package com.privod.platform.modules.specification.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.commercialProposal.domain.CommercialProposalItem;
import com.privod.platform.modules.commercialProposal.domain.ProposalStatus;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalRepository;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalItemRepository;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.specification.domain.CompetitiveList;
import com.privod.platform.modules.specification.domain.CompetitiveListEntry;
import com.privod.platform.modules.specification.domain.CompetitiveListStatus;
import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.repository.CompetitiveListEntryRepository;
import com.privod.platform.modules.specification.repository.CompetitiveListRepository;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
import com.privod.platform.modules.specification.web.dto.ChangeCompetitiveListStatusRequest;
import com.privod.platform.modules.specification.web.dto.CompetitiveListEntryResponse;
import com.privod.platform.modules.specification.web.dto.CompetitiveListResponse;
import com.privod.platform.modules.specification.web.dto.CreateCompetitiveListEntryRequest;
import com.privod.platform.modules.specification.web.dto.CreateCompetitiveListRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompetitiveListService {

    /** Scoring weight for unit price criterion (out of 100). */
    private static final BigDecimal WEIGHT_PRICE = new BigDecimal("50");
    /** Scoring weight for delivery time criterion (out of 100). */
    private static final BigDecimal WEIGHT_DELIVERY = new BigDecimal("25");
    /** Scoring weight for warranty duration criterion (out of 100). */
    private static final BigDecimal WEIGHT_WARRANTY = new BigDecimal("15");
    /** Scoring weight for payment terms criterion (out of 100). */
    private static final BigDecimal WEIGHT_PAYMENT = new BigDecimal("10");

    private final CompetitiveListRepository competitiveListRepository;
    private final CompetitiveListEntryRepository competitiveListEntryRepository;
    private final SpecificationRepository specificationRepository;
    private final CommercialProposalItemRepository commercialProposalItemRepository;
    private final CommercialProposalRepository commercialProposalRepository;
    private final BudgetRepository budgetRepository;
    private final AuditService auditService;
    private final com.privod.platform.modules.procurement.repository.PurchaseRequestRepository purchaseRequestRepository;

    @Transactional(readOnly = true)
    public Page<CompetitiveListResponse> list(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return competitiveListRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(CompetitiveListResponse::fromEntity);
        }
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return competitiveListRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(CompetitiveListResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<CompetitiveListResponse> listBySpecification(UUID specificationId, Pageable pageable) {
        List<CompetitiveList> all = competitiveListRepository.findBySpecificationIdAndDeletedFalse(specificationId);
        // Wrap in a simple page for consistency
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<CompetitiveListResponse> content = all.subList(Math.min(start, all.size()), end)
                .stream().map(CompetitiveListResponse::fromEntity).toList();
        return new org.springframework.data.domain.PageImpl<>(content, pageable, all.size());
    }

    @Transactional(readOnly = true)
    public CompetitiveListResponse getById(UUID id) {
        CompetitiveList cl = getOrThrow(id);
        return CompetitiveListResponse.fromEntity(cl);
    }

    @Transactional
    public CompetitiveListResponse createFromPurchaseRequest(UUID purchaseRequestId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        com.privod.platform.modules.procurement.domain.PurchaseRequest pr = 
                purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Заявка на закупку не найдена: " + purchaseRequestId));

        CompetitiveList cl = CompetitiveList.builder()
                .organizationId(organizationId)
                .projectId(pr.getProjectId())
                .specificationId(pr.getSpecificationId() != null ? pr.getSpecificationId() : UUID.randomUUID()) // Fallback if no spec
                .purchaseRequestId(purchaseRequestId)
                .name("Тендер по заявке " + pr.getName())
                .status(CompetitiveListStatus.DRAFT)
                .minProposalsRequired(3)
                .createdById(userId)
                .build();

        cl = competitiveListRepository.save(cl);
        auditService.logCreate("CompetitiveList", cl.getId());

        log.info("Competitive list created from PR: {} ({})", cl.getName(), cl.getId());
        return CompetitiveListResponse.fromEntity(cl);
    }

    @Transactional
    public CompetitiveListResponse create(CreateCompetitiveListRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        Specification specification = specificationRepository.findById(request.specificationId())
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Спецификация не найдена: " + request.specificationId()));

        CompetitiveList cl = CompetitiveList.builder()
                .organizationId(organizationId)
                .projectId(specification.getProjectId())
                .specificationId(request.specificationId())
                .name(request.name())
                .status(CompetitiveListStatus.DRAFT)
                .minProposalsRequired(request.minProposalsRequired() != null
                        ? request.minProposalsRequired() : 3)
                .createdById(userId)
                .notes(request.notes())
                .build();

        cl = competitiveListRepository.save(cl);
        auditService.logCreate("CompetitiveList", cl.getId());

        log.info("Competitive list created: {} for specification {} ({})",
                cl.getName(), request.specificationId(), cl.getId());
        return CompetitiveListResponse.fromEntity(cl);
    }

    @Transactional
    public CompetitiveListResponse update(UUID id, String name, String notes) {
        CompetitiveList cl = getOrThrow(id);

        if (name != null) {
            cl.setName(name);
        }
        if (notes != null) {
            cl.setNotes(notes);
        }

        cl = competitiveListRepository.save(cl);
        auditService.logUpdate("CompetitiveList", cl.getId(), "multiple", null, null);

        log.info("Competitive list updated: {} ({})", cl.getName(), cl.getId());
        return CompetitiveListResponse.fromEntity(cl);
    }

    @Transactional
    public CompetitiveListResponse changeStatus(UUID id, ChangeCompetitiveListStatusRequest request) {
        CompetitiveList cl = getOrThrow(id);
        CompetitiveListStatus oldStatus = cl.getStatus();
        CompetitiveListStatus newStatus = request.status();

        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Недопустимый переход статуса КЛ: %s -> %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        // Validate: cannot set DECIDED if any specItem has < minProposalsRequired entries
        if (newStatus == CompetitiveListStatus.DECIDED) {
            validateMinProposals(cl);

            cl.setDecidedById(SecurityUtils.requireCurrentUserId());
            cl.setDecidedAt(Instant.now());
        }

        cl.setStatus(newStatus);
        cl = competitiveListRepository.save(cl);
        auditService.logStatusChange("CompetitiveList", cl.getId(), oldStatus.name(), newStatus.name());

        log.info("Competitive list status changed: {} from {} to {} ({})",
                cl.getName(), oldStatus, newStatus, cl.getId());
        return CompetitiveListResponse.fromEntity(cl);
    }

    @Transactional(readOnly = true)
    public List<CompetitiveListEntryResponse> getEntries(UUID listId) {
        getOrThrow(listId);
        return competitiveListEntryRepository.findByCompetitiveListId(listId)
                .stream()
                .map(CompetitiveListEntryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CompetitiveListEntryResponse addEntry(UUID listId, CreateCompetitiveListEntryRequest request) {
        getOrThrow(listId);

        BigDecimal unitPrice = request.unitPrice() != null ? request.unitPrice() : BigDecimal.ZERO;
        BigDecimal quantity = request.quantity() != null ? request.quantity() : BigDecimal.ZERO;
        BigDecimal totalPrice = unitPrice.multiply(quantity);

        CompetitiveListEntry entry = CompetitiveListEntry.builder()
                .competitiveListId(listId)
                .specItemId(request.specItemId())
                .vendorId(request.vendorId())
                .vendorName(request.vendorName())
                .unitPrice(unitPrice)
                .quantity(quantity)
                .totalPrice(totalPrice)
                .deliveryDays(request.deliveryDays())
                .paymentTerms(request.paymentTerms())
                .isWinner(false)
                .notes(request.notes())
                .build();

        entry = competitiveListEntryRepository.save(entry);
        auditService.logCreate("CompetitiveListEntry", entry.getId());

        log.info("Competitive list entry added to list {}: vendor={} specItem={} ({})",
                listId, request.vendorName(), request.specItemId(), entry.getId());
        return CompetitiveListEntryResponse.fromEntity(entry);
    }

    @Transactional
    public CompetitiveListEntryResponse updateEntry(UUID listId, UUID entryId,
                                                     CreateCompetitiveListEntryRequest request) {
        getOrThrow(listId);
        CompetitiveListEntry entry = getEntryOrThrow(entryId);

        if (!entry.getCompetitiveListId().equals(listId)) {
            throw new IllegalArgumentException("Запись не принадлежит данному конкурентному листу");
        }

        if (request.specItemId() != null) {
            entry.setSpecItemId(request.specItemId());
        }
        if (request.vendorId() != null) {
            entry.setVendorId(request.vendorId());
        }
        if (request.vendorName() != null) {
            entry.setVendorName(request.vendorName());
        }
        if (request.unitPrice() != null) {
            entry.setUnitPrice(request.unitPrice());
        }
        if (request.quantity() != null) {
            entry.setQuantity(request.quantity());
        }
        if (request.deliveryDays() != null) {
            entry.setDeliveryDays(request.deliveryDays());
        }
        if (request.paymentTerms() != null) {
            entry.setPaymentTerms(request.paymentTerms());
        }
        if (request.notes() != null) {
            entry.setNotes(request.notes());
        }

        // Recalculate total price
        entry.setTotalPrice(entry.getUnitPrice().multiply(entry.getQuantity()));

        entry = competitiveListEntryRepository.save(entry);
        auditService.logUpdate("CompetitiveListEntry", entry.getId(), "multiple", null, null);

        log.info("Competitive list entry updated: {} ({})", entryId, listId);
        return CompetitiveListEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteEntry(UUID listId, UUID entryId) {
        getOrThrow(listId);
        CompetitiveListEntry entry = getEntryOrThrow(entryId);

        if (!entry.getCompetitiveListId().equals(listId)) {
            throw new IllegalArgumentException("Запись не принадлежит данному конкурентному листу");
        }

        competitiveListEntryRepository.delete(entry);
        auditService.logDelete("CompetitiveListEntry", entryId);

        log.info("Competitive list entry deleted: {} from list {}", entryId, listId);
    }

    @Transactional
    public CompetitiveListEntryResponse selectWinner(UUID listId, UUID entryId, String selectionReason) {
        CompetitiveList cl = getOrThrow(listId);
        CompetitiveListEntry entry = getEntryOrThrow(entryId);

        if (!entry.getCompetitiveListId().equals(listId)) {
            throw new IllegalArgumentException("Запись не принадлежит данному конкурентному листу");
        }

        // Validate minimum proposals for this specItem
        long count = competitiveListEntryRepository.countByCompetitiveListIdAndSpecItemId(
                listId, entry.getSpecItemId());
        if (count < cl.getMinProposalsRequired()) {
            throw new IllegalStateException(
                    String.format("Для выбора победителя необходимо минимум %d предложений по позиции, текущее количество: %d",
                            cl.getMinProposalsRequired(), count));
        }

        // Unset previous winners for the same specItemId
        List<CompetitiveListEntry> sameItemEntries = competitiveListEntryRepository
                .findByCompetitiveListIdAndSpecItemId(listId, entry.getSpecItemId());
        for (CompetitiveListEntry e : sameItemEntries) {
            if (e.isWinner()) {
                e.setWinner(false);
                e.setSelectionReason(null);
                competitiveListEntryRepository.save(e);
            }
        }

        // Set new winner
        entry.setWinner(true);
        entry.setSelectionReason(selectionReason);
        entry = competitiveListEntryRepository.save(entry);

        auditService.logUpdate("CompetitiveListEntry", entry.getId(), "isWinner", "false", "true");

        log.info("Winner selected in competitive list {}: entry {} for specItem {}",
                listId, entryId, entry.getSpecItemId());
        return CompetitiveListEntryResponse.fromEntity(entry);
    }

    @Transactional(readOnly = true)
    public Map<UUID, CompetitiveListEntryResponse> getSummary(UUID listId) {
        getOrThrow(listId);

        List<CompetitiveListEntry> entries = competitiveListEntryRepository.findByCompetitiveListId(listId);

        // Group by specItemId and find best (lowest) price for each
        Map<UUID, CompetitiveListEntry> bestPrices = new HashMap<>();
        for (CompetitiveListEntry entry : entries) {
            UUID specItemId = entry.getSpecItemId();
            CompetitiveListEntry current = bestPrices.get(specItemId);
            if (current == null || entry.getUnitPrice().compareTo(current.getUnitPrice()) < 0) {
                bestPrices.put(specItemId, entry);
            }
        }

        Map<UUID, CompetitiveListEntryResponse> result = new HashMap<>();
        bestPrices.forEach((specItemId, entry) ->
                result.put(specItemId, CompetitiveListEntryResponse.fromEntity(entry)));
        return result;
    }

    @Transactional
    public void applyToCp(UUID listId, UUID cpId) {
        CompetitiveList cl = getOrThrow(listId);
        if (cl.getStatus() != CompetitiveListStatus.DECIDED && cl.getStatus() != CompetitiveListStatus.APPROVED) {
            throw new IllegalStateException("Применение в КП доступно только для КЛ со статусом Решение принято/Утверждён");
        }

        var proposal = commercialProposalRepository.findByIdAndDeletedFalse(cpId)
                .orElseThrow(() -> new EntityNotFoundException("КП не найдено: " + cpId));
        if (proposal.getStatus() != ProposalStatus.DRAFT && proposal.getStatus() != ProposalStatus.IN_REVIEW) {
            throw new IllegalStateException("Применение КЛ допустимо только для КП в статусе Черновик/На рассмотрении");
        }
        Budget budget = budgetRepository.findByIdAndDeletedFalse(proposal.getBudgetId())
                .orElseThrow(() -> new EntityNotFoundException("Бюджет не найден: " + proposal.getBudgetId()));
        if (budget.getStatus() == BudgetStatus.FROZEN || budget.getStatus() == BudgetStatus.CLOSED) {
            throw new IllegalStateException("Нельзя применять КЛ: бюджет заморожен или закрыт");
        }

        List<CompetitiveListEntry> winners = competitiveListEntryRepository
                .findByCompetitiveListIdAndIsWinnerTrue(listId);

        if (winners.isEmpty()) {
            throw new IllegalStateException("Нет выбранных победителей для применения к КП");
        }

        List<CommercialProposalItem> cpItems = commercialProposalItemRepository.findByProposalId(cpId);

        for (CompetitiveListEntry winner : winners) {
            int appliedCount = 0;
            for (CommercialProposalItem cpItem : cpItems) {
                boolean matchesBySpecItem = cpItem.getSpecItemId() != null
                        && cpItem.getSpecItemId().equals(winner.getSpecItemId());
                boolean matchesByLegacyBudgetMapping = cpItem.getBudgetItemId() != null
                        && cpItem.getBudgetItemId().equals(winner.getSpecItemId());

                if (!matchesBySpecItem && !matchesByLegacyBudgetMapping) {
                    continue;
                }

                cpItem.setCostPrice(winner.getUnitPrice());
                cpItem.setTotalCost(winner.getUnitPrice().multiply(cpItem.getQuantity()));
                commercialProposalItemRepository.save(cpItem);
                appliedCount++;

                log.info("Applied winner price {} to CP item {} (specItem={}, budgetItem={})",
                        winner.getUnitPrice(), cpItem.getId(), cpItem.getSpecItemId(), cpItem.getBudgetItemId());
            }

            if (appliedCount == 0) {
                log.warn("No CP items matched winner entry {} for specItem {}", winner.getId(), winner.getSpecItemId());
            }
        }

        auditService.logUpdate("CompetitiveList", listId, "appliedToCp", null, cpId.toString());
        log.info("Competitive list {} winners applied to commercial proposal {}", listId, cpId);
    }

    /**
     * Weighted scoring: price 50%, delivery 25%, warranty 15%, payment terms 10%.
     * Ranks entries within each specItem group and updates score + rank_position.
     */
    @Transactional
    public List<CompetitiveListEntryResponse> autoRankEntries(UUID listId) {
        getOrThrow(listId);
        List<CompetitiveListEntry> entries = competitiveListEntryRepository.findByCompetitiveListId(listId);
        if (entries.isEmpty()) return List.of();

        // Group by specItemId
        Map<UUID, List<CompetitiveListEntry>> grouped = new HashMap<>();
        for (CompetitiveListEntry e : entries) {
            grouped.computeIfAbsent(e.getSpecItemId(), k -> new ArrayList<>()).add(e);
        }

        for (List<CompetitiveListEntry> group : grouped.values()) {
            // Find min/max for normalization
            BigDecimal minPrice = group.stream().map(CompetitiveListEntry::getUnitPrice).min(Comparator.naturalOrder()).orElse(BigDecimal.ONE);
            BigDecimal maxPrice = group.stream().map(CompetitiveListEntry::getUnitPrice).max(Comparator.naturalOrder()).orElse(BigDecimal.ONE);
            int minDays = group.stream().map(e -> e.getDeliveryDays() != null ? e.getDeliveryDays() : 0).min(Comparator.naturalOrder()).orElse(0);
            int maxDays = group.stream().map(e -> e.getDeliveryDays() != null ? e.getDeliveryDays() : 0).max(Comparator.naturalOrder()).orElse(1);
            int maxWarranty = group.stream().map(e -> e.getWarrantyMonths() != null ? e.getWarrantyMonths() : 0).max(Comparator.naturalOrder()).orElse(1);

            for (CompetitiveListEntry entry : group) {
                BigDecimal priceScore = BigDecimal.ZERO;
                if (maxPrice.compareTo(minPrice) != 0) {
                    priceScore = maxPrice.subtract(entry.getUnitPrice())
                            .divide(maxPrice.subtract(minPrice), 4, RoundingMode.HALF_UP)
                            .multiply(WEIGHT_PRICE);
                } else {
                    priceScore = WEIGHT_PRICE;
                }

                BigDecimal deliveryScore = BigDecimal.ZERO;
                int days = entry.getDeliveryDays() != null ? entry.getDeliveryDays() : 0;
                if (maxDays > minDays) {
                    deliveryScore = BigDecimal.valueOf(maxDays - days)
                            .divide(BigDecimal.valueOf(maxDays - minDays), 4, RoundingMode.HALF_UP)
                            .multiply(WEIGHT_DELIVERY);
                } else {
                    deliveryScore = WEIGHT_DELIVERY;
                }

                BigDecimal warrantyScore = BigDecimal.ZERO;
                int warranty = entry.getWarrantyMonths() != null ? entry.getWarrantyMonths() : 0;
                if (maxWarranty > 0) {
                    warrantyScore = BigDecimal.valueOf(warranty)
                            .divide(BigDecimal.valueOf(maxWarranty), 4, RoundingMode.HALF_UP)
                            .multiply(WEIGHT_WARRANTY);
                }

                // Payment terms: lower prepayment and longer delay = better
                BigDecimal paymentScore = WEIGHT_PAYMENT;
                BigDecimal prepay = entry.getPrepaymentPercent() != null ? entry.getPrepaymentPercent() : BigDecimal.ZERO;
                if (prepay.compareTo(BigDecimal.ZERO) > 0) {
                    paymentScore = WEIGHT_PAYMENT.subtract(
                            prepay.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP).multiply(WEIGHT_PAYMENT));
                }

                entry.setScore(priceScore.add(deliveryScore).add(warrantyScore).add(paymentScore)
                        .setScale(2, RoundingMode.HALF_UP));
            }

            // Rank by score descending
            group.sort(Comparator.comparing(CompetitiveListEntry::getScore, Comparator.reverseOrder()));
            for (int i = 0; i < group.size(); i++) {
                group.get(i).setRankPosition(i + 1);
            }
        }

        competitiveListEntryRepository.saveAll(entries);
        log.info("Auto-ranked {} entries in competitive list {}", entries.size(), listId);

        return entries.stream().map(CompetitiveListEntryResponse::fromEntity).toList();
    }

    /**
     * Auto-select the lowest price entry as winner for each specItem, and update CL best price/vendor.
     */
    @Transactional
    public CompetitiveListResponse autoSelectBestPrices(UUID listId) {
        CompetitiveList cl = getOrThrow(listId);
        List<CompetitiveListEntry> entries = competitiveListEntryRepository.findByCompetitiveListId(listId);

        // Group by specItemId, find lowest price (skip rejected)
        Map<UUID, CompetitiveListEntry> bestByItem = new HashMap<>();
        for (CompetitiveListEntry entry : entries) {
            if (entry.getRejectionType() != null) continue;
            CompetitiveListEntry current = bestByItem.get(entry.getSpecItemId());
            if (current == null || entry.getUnitPrice().compareTo(current.getUnitPrice()) < 0) {
                bestByItem.put(entry.getSpecItemId(), entry);
            }
        }

        // Clear all winners first
        for (CompetitiveListEntry entry : entries) {
            if (entry.isWinner()) {
                entry.setWinner(false);
                entry.setSelectionReason(null);
            }
        }

        // Set best as winners
        BigDecimal overallBestPrice = null;
        String overallBestVendor = null;
        for (CompetitiveListEntry best : bestByItem.values()) {
            best.setWinner(true);
            best.setSelectionReason("Автовыбор: лучшая цена");
            if (overallBestPrice == null || best.getUnitPrice().compareTo(overallBestPrice) < 0) {
                overallBestPrice = best.getUnitPrice();
                overallBestVendor = best.getVendorName();
            }
        }

        competitiveListEntryRepository.saveAll(entries);

        cl.setBestPrice(overallBestPrice);
        cl.setBestVendorName(overallBestVendor);
        cl = competitiveListRepository.save(cl);

        log.info("Auto-selected best prices for competitive list {}: {} winners", listId, bestByItem.size());
        return CompetitiveListResponse.fromEntity(cl);
    }

    @Transactional
    public List<CompetitiveListEntryResponse> bulkAddEntries(UUID listId, List<CreateCompetitiveListEntryRequest> requests) {
        getOrThrow(listId);
        List<CompetitiveListEntryResponse> results = new ArrayList<>();
        for (CreateCompetitiveListEntryRequest request : requests) {
            results.add(addEntry(listId, request));
        }
        log.info("Bulk added {} entries to competitive list {}", requests.size(), listId);
        return results;
    }

    @Transactional
    public CompetitiveListEntryResponse rejectEntry(UUID listId, UUID entryId, String rejectionType, String rejectionReason) {
        getOrThrow(listId);
        CompetitiveListEntry entry = getEntryOrThrow(entryId);
        if (!entry.getCompetitiveListId().equals(listId)) {
            throw new IllegalArgumentException("Запись не принадлежит данному конкурентному листу");
        }

        // If entry was a winner, remove winner status
        if (entry.isWinner()) {
            entry.setWinner(false);
            entry.setSelectionReason(null);
        }

        entry.setRejectionType(rejectionType);
        entry.setRejectionReason(rejectionReason);
        entry = competitiveListEntryRepository.save(entry);
        auditService.logUpdate("CompetitiveListEntry", entry.getId(), "rejectionType", null, rejectionType);

        log.info("Entry {} rejected in competitive list {}: type={}, reason={}",
                entryId, listId, rejectionType, rejectionReason);
        return CompetitiveListEntryResponse.fromEntity(entry);
    }

    @Transactional
    public CompetitiveListEntryResponse unrejectEntry(UUID listId, UUID entryId) {
        getOrThrow(listId);
        CompetitiveListEntry entry = getEntryOrThrow(entryId);
        if (!entry.getCompetitiveListId().equals(listId)) {
            throw new IllegalArgumentException("Запись не принадлежит данному конкурентному листу");
        }

        entry.setRejectionType(null);
        entry.setRejectionReason(null);
        entry = competitiveListEntryRepository.save(entry);
        auditService.logUpdate("CompetitiveListEntry", entry.getId(), "rejectionType", "cleared", null);

        log.info("Entry {} un-rejected in competitive list {}", entryId, listId);
        return CompetitiveListEntryResponse.fromEntity(entry);
    }

    private CompetitiveList getOrThrow(UUID id) {
        return competitiveListRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Конкурентный лист не найден: " + id));
    }

    private CompetitiveListEntry getEntryOrThrow(UUID id) {
        return competitiveListEntryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Запись конкурентного листа не найдена: " + id));
    }

    private void validateMinProposals(CompetitiveList cl) {
        List<CompetitiveListEntry> entries = competitiveListEntryRepository
                .findByCompetitiveListId(cl.getId());

        // Group entries by specItemId and check each group
        Map<UUID, Long> countBySpecItem = new HashMap<>();
        for (CompetitiveListEntry entry : entries) {
            countBySpecItem.merge(entry.getSpecItemId(), 1L, Long::sum);
        }

        for (Map.Entry<UUID, Long> e : countBySpecItem.entrySet()) {
            if (e.getValue() < cl.getMinProposalsRequired()) {
                throw new IllegalStateException(
                        String.format("Позиция %s имеет %d предложений, требуется минимум %d",
                                e.getKey(), e.getValue(), cl.getMinProposalsRequired()));
            }
        }
    }
}
