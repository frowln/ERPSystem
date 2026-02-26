package com.privod.platform.modules.commercialProposal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.commercialProposal.domain.CommercialProposal;
import com.privod.platform.modules.commercialProposal.domain.CommercialProposalItem;
import com.privod.platform.modules.commercialProposal.domain.ProposalItemStatus;
import com.privod.platform.modules.commercialProposal.domain.ProposalStatus;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalItemRepository;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalRepository;
import com.privod.platform.modules.commercialProposal.web.dto.ChangeProposalStatusRequest;
import com.privod.platform.modules.commercialProposal.web.dto.CommercialProposalItemResponse;
import com.privod.platform.modules.commercialProposal.web.dto.CommercialProposalResponse;
import com.privod.platform.modules.commercialProposal.web.dto.CreateCommercialProposalRequest;
import com.privod.platform.modules.commercialProposal.web.dto.LinkEstimateRequest;
import com.privod.platform.modules.commercialProposal.web.dto.SelectInvoiceRequest;
import com.privod.platform.modules.commercialProposal.web.dto.UpdateCommercialProposalItemRequest;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetItemPriceSource;
import com.privod.platform.modules.finance.domain.BudgetItemType;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceLine;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.specification.domain.CompetitiveListEntry;
import com.privod.platform.modules.specification.repository.CompetitiveListEntryRepository;
import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
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
import java.util.Map;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommercialProposalService {

    private final CommercialProposalRepository proposalRepository;
    private final CommercialProposalItemRepository itemRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineRepository invoiceLineRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final CompetitiveListEntryRepository competitiveListEntryRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    // ── List & Get ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<CommercialProposalResponse> list(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Page<CommercialProposal> page;
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            page = proposalRepository.findByProjectIdAndDeletedFalse(projectId, pageable);
        } else {
            page = proposalRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable);
        }

        return page.map(CommercialProposalResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CommercialProposalResponse getById(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal proposal = getProposalOrThrow(id, organizationId);
        return CommercialProposalResponse.fromEntity(proposal);
    }

    // ── Create from Budget ──────────────────────────────────────────────────────

    @Transactional
    public CommercialProposalResponse createFromBudget(CreateCommercialProposalRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        // Validate budget exists and belongs to the organization
        var budget = budgetRepository.findByIdAndDeletedFalse(request.budgetId())
                .orElseThrow(() -> new EntityNotFoundException("Бюджет не найден: " + request.budgetId()));

        validateProjectTenant(budget.getProjectId(), organizationId);

        // Create the commercial proposal
        CommercialProposal proposal = CommercialProposal.builder()
                .organizationId(organizationId)
                .projectId(budget.getProjectId())
                .budgetId(request.budgetId())
                .name(request.name())
                .status(ProposalStatus.DRAFT)
                .totalCostPrice(BigDecimal.ZERO)
                .createdById(userId)
                .notes(request.notes())
                .build();

        proposal = proposalRepository.save(proposal);

        // Query all non-section BudgetItems for the given budgetId
        List<BudgetItem> budgetItems = budgetItemRepository
                .findByBudgetIdAndDeletedFalseOrderBySequenceAsc(request.budgetId());

        BigDecimal totalCostPrice = BigDecimal.ZERO;

        for (BudgetItem budgetItem : budgetItems) {
            if (budgetItem.isSection()) {
                continue;
            }

            String itemType = mapBudgetItemType(budgetItem.getItemType());

            BigDecimal costPrice = budgetItem.getCostPrice() != null
                    ? budgetItem.getCostPrice() : BigDecimal.ZERO;
            BigDecimal quantity = budgetItem.getQuantity() != null
                    ? budgetItem.getQuantity() : BigDecimal.ONE;
            BigDecimal totalCost = costPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);

            CommercialProposalItem item = CommercialProposalItem.builder()
                    .proposalId(proposal.getId())
                    .budgetItemId(budgetItem.getId())
                    .itemType(itemType)
                    .tradingCoefficient(BigDecimal.ONE)
                    .costPrice(costPrice)
                    .quantity(quantity)
                    .totalCost(totalCost)
                    .status(ProposalItemStatus.UNPROCESSED)
                    .build();

            itemRepository.save(item);
            totalCostPrice = totalCostPrice.add(totalCost);
        }

        // Update total cost price on the proposal
        proposal.setTotalCostPrice(totalCostPrice);
        proposal = proposalRepository.save(proposal);

        auditService.logCreate("CommercialProposal", proposal.getId());
        log.info("КП создано из бюджета: {} ({})", proposal.getName(), proposal.getId());

        return CommercialProposalResponse.fromEntity(proposal);
    }

    // ── Status Management ───────────────────────────────────────────────────────

    @Transactional
    public CommercialProposalResponse updateStatus(UUID id, ChangeProposalStatusRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();
        CommercialProposal proposal = getProposalOrThrow(id, organizationId);

        ProposalStatus oldStatus = proposal.getStatus();
        ProposalStatus newStatus = request.status();
        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    "Недопустимый переход статуса КП: " + oldStatus + " -> " + newStatus);
        }

        proposal.setStatus(newStatus);

        if (newStatus == ProposalStatus.APPROVED) {
            proposal.setApprovedById(userId);
            proposal.setApprovedAt(Instant.now());
        }

        proposal = proposalRepository.save(proposal);
        auditService.logStatusChange("CommercialProposal", proposal.getId(),
                oldStatus.name(), newStatus.name());

        log.info("КП статус изменён: {} → {} ({})", oldStatus.getDisplayName(),
                newStatus.getDisplayName(), proposal.getId());

        return CommercialProposalResponse.fromEntity(proposal);
    }

    // ── Items ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommercialProposalItemResponse> getItems(UUID proposalId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getProposalOrThrow(proposalId, organizationId);

        List<CommercialProposalItem> items = itemRepository.findByProposalId(proposalId);
        return toItemResponses(items);
    }

    @Transactional(readOnly = true)
    public List<CommercialProposalItemResponse> getMaterials(UUID proposalId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getProposalOrThrow(proposalId, organizationId);

        List<CommercialProposalItem> items = itemRepository.findByProposalIdAndItemType(proposalId, "MATERIAL");
        return toItemResponses(items);
    }

    @Transactional(readOnly = true)
    public List<CommercialProposalItemResponse> getWorks(UUID proposalId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getProposalOrThrow(proposalId, organizationId);

        List<CommercialProposalItem> items = itemRepository.findByProposalIdAndItemType(proposalId, "WORK");
        return toItemResponses(items);
    }

    @Transactional
    public CommercialProposalItemResponse updateItem(UUID proposalId, UUID itemId,
                                                      UpdateCommercialProposalItemRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal proposal = getProposalOrThrow(proposalId, organizationId);
        CommercialProposalItem item = getItemOrThrow(proposalId, itemId);

        if (request.costPrice() != null) {
            item.setCostPrice(request.costPrice());
        }
        if (request.quantity() != null) {
            item.setQuantity(request.quantity());
        }
        if (request.tradingCoefficient() != null) {
            item.setTradingCoefficient(request.tradingCoefficient());
            if ("WORK".equals(item.getItemType())
                    && request.costPrice() == null
                    && item.getEstimateItemId() != null) {
                EstimateItem estimateItem = loadEstimateItemOrThrow(item.getEstimateItemId());
                if (proposal.getProjectId() != null
                        && estimateItem.getProjectId() != null
                        && !proposal.getProjectId().equals(estimateItem.getProjectId())) {
                    throw new IllegalArgumentException("Выбранная позиция сметы относится к другому проекту");
                }
                BigDecimal estimateUnitPrice = nonNull(estimateItem.getUnitPrice());
                item.setCostPrice(estimateUnitPrice
                        .multiply(item.getTradingCoefficient())
                        .setScale(2, RoundingMode.HALF_UP));
            }
        }
        if (request.notes() != null) {
            item.setNotes(request.notes());
        }

        recalculateItemTotalCost(item);
        item = itemRepository.save(item);

        recalculateProposalTotal(proposalId);
        auditService.logUpdate("CommercialProposalItem", itemId, "multiple", null, null);

        log.info("КП позиция обновлена: {} в КП {}", itemId, proposalId);
        return toItemResponse(item);
    }

    @Transactional
    public CommercialProposalItemResponse selectInvoice(UUID proposalId, UUID itemId,
                                                         SelectInvoiceRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal proposal = getProposalOrThrow(proposalId, organizationId);
        CommercialProposalItem item = getItemOrThrow(proposalId, itemId);
        UUID budgetItemId = item.getBudgetItemId();

        if (!"MATERIAL".equals(item.getItemType())) {
            throw new IllegalStateException("Выбор счёта доступен только для позиций материалов");
        }

        InvoiceLine selectedLine = loadInvoiceLineOrThrow(request.invoiceLineId());
        Invoice invoice = invoiceRepository.findByIdAndDeletedFalse(selectedLine.getInvoiceId())
                .orElseThrow(() -> new EntityNotFoundException("Счёт не найден для строки: " + selectedLine.getId()));

        if (!organizationId.equals(invoice.getOrganizationId())) {
            throw new EntityNotFoundException("Строка счёта не найдена: " + selectedLine.getId());
        }
        if (invoice.getInvoiceType() != InvoiceType.RECEIVED) {
            throw new IllegalArgumentException("Для материалов можно выбирать только входящие счета");
        }
        if (!isApprovedInvoiceStatus(invoice.getStatus())) {
            throw new IllegalStateException("Можно выбирать только счета в статусе На согласовании/Согласован/Оплачен");
        }
        if (proposal.getProjectId() != null && invoice.getProjectId() != null
                && !proposal.getProjectId().equals(invoice.getProjectId())) {
            throw new IllegalArgumentException("Выбранная строка счёта относится к другому проекту");
        }
        if (budgetItemId != null) {
            BudgetItem budgetItem = budgetItemRepository.findById(budgetItemId)
                    .filter(found -> !found.isDeleted())
                    .orElseThrow(() -> new EntityNotFoundException("Позиция ФМ не найдена: " + budgetItemId));
            BigDecimal expectedQty = nonNull(budgetItem.getQuantity());
            BigDecimal lineQty = nonNull(selectedLine.getQuantity());
            if (expectedQty.compareTo(BigDecimal.ZERO) > 0
                    && lineQty.compareTo(BigDecimal.ZERO) > 0
                    && lineQty.compareTo(expectedQty.multiply(new BigDecimal("3"))) > 0) {
                throw new IllegalStateException("Количество в строке счёта выбивается из ожидаемого объёма позиции");
            }
            if (budgetItem.getSectionId() != null
                    && invoice.getDisciplineMark() != null
                    && budgetItem.getDisciplineMark() != null
                    && !budgetItem.getDisciplineMark().equalsIgnoreCase(invoice.getDisciplineMark())) {
                throw new IllegalStateException("Дисциплина счёта не совпадает с дисциплиной позиции ФМ");
            }
            if (selectedLine.getUnitOfMeasure() != null
                    && budgetItem.getUnit() != null
                    && !budgetItem.getUnit().equalsIgnoreCase(selectedLine.getUnitOfMeasure())) {
                throw new IllegalStateException("Единица измерения строки счёта не совпадает с позицией ФМ");
            }
        }
        if (selectedLine.isSelectedForCp()
                && selectedLine.getCpItemId() != null
                && !selectedLine.getCpItemId().equals(item.getId())) {
            throw new IllegalStateException("Строка счёта уже выбрана для другой позиции КП");
        }

        UUID cpItemId = item.getId();
        UUID previousInvoiceLineId = item.getSelectedInvoiceLineId();
        if (previousInvoiceLineId != null && !previousInvoiceLineId.equals(selectedLine.getId())) {
            invoiceLineRepository.findById(previousInvoiceLineId)
                    .filter(prev -> !prev.isDeleted())
                    .ifPresent(prev -> {
                        if (cpItemId.equals(prev.getCpItemId())) {
                            prev.setSelectedForCp(false);
                            prev.setCpItemId(null);
                            invoiceLineRepository.save(prev);
                        }
                    });
        }

        selectedLine.setSelectedForCp(true);
        selectedLine.setCpItemId(cpItemId);
        invoiceLineRepository.save(selectedLine);

        item.setSelectedInvoiceLineId(selectedLine.getId());
        item.setCostPrice(nonNull(selectedLine.getUnitPrice()));
        item.setStatus(ProposalItemStatus.PRICE_SELECTED);
        recalculateItemTotalCost(item);
        item = itemRepository.save(item);
        recalculateProposalTotal(proposalId);

        auditService.logUpdate("CommercialProposalItem", itemId,
                "selectedInvoiceLineId", null, request.invoiceLineId().toString());

        log.info("КП позиция — счёт выбран: {} → {} в КП {}", itemId, request.invoiceLineId(), proposalId);
        return toItemResponse(item);
    }

    @Transactional
    public CommercialProposalItemResponse linkEstimate(UUID proposalId, UUID itemId,
                                                        LinkEstimateRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal proposal = getProposalOrThrow(proposalId, organizationId);
        CommercialProposalItem item = getItemOrThrow(proposalId, itemId);

        if (!"WORK".equals(item.getItemType())) {
            throw new IllegalStateException("Привязка сметы доступна только для позиций работ");
        }

        EstimateItem estimateItem = loadEstimateItemOrThrow(request.estimateItemId());
        if (proposal.getProjectId() != null && estimateItem.getProjectId() != null
                && !proposal.getProjectId().equals(estimateItem.getProjectId())) {
            throw new IllegalArgumentException("Выбранная позиция сметы относится к другому проекту");
        }

        item.setEstimateItemId(request.estimateItemId());
        if (request.tradingCoefficient() != null) {
            item.setTradingCoefficient(request.tradingCoefficient());
        }
        BigDecimal coefficient = item.getTradingCoefficient() != null ? item.getTradingCoefficient() : BigDecimal.ONE;
        BigDecimal estimateUnitPrice = nonNull(estimateItem.getUnitPrice());
        item.setCostPrice(estimateUnitPrice.multiply(coefficient).setScale(2, RoundingMode.HALF_UP));
        if (estimateItem.getQuantity() != null && estimateItem.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
            item.setQuantity(estimateItem.getQuantity());
        }
        item.setStatus(ProposalItemStatus.PRICE_SELECTED);

        recalculateItemTotalCost(item);
        item = itemRepository.save(item);

        recalculateProposalTotal(proposalId);
        auditService.logUpdate("CommercialProposalItem", itemId,
                "estimateItemId", null, request.estimateItemId().toString());

        log.info("КП позиция — смета привязана: {} → {} в КП {}", itemId, request.estimateItemId(), proposalId);
        return toItemResponse(item);
    }

    @Transactional
    public CommercialProposalItemResponse approveItem(UUID proposalId, UUID itemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();
        getProposalOrThrow(proposalId, organizationId);
        CommercialProposalItem item = getItemOrThrow(proposalId, itemId);

        if ("MATERIAL".equals(item.getItemType()) && item.getSelectedInvoiceLineId() == null) {
            throw new IllegalStateException("Для согласования материала сначала выберите счёт");
        }
        if ("WORK".equals(item.getItemType())
                && item.getEstimateItemId() == null
                && item.getCostPrice() == null) {
            throw new IllegalStateException("Для согласования работы требуется смета или ручная себестоимость");
        }

        ProposalItemStatus oldStatus = item.getStatus();

        item.setStatus(ProposalItemStatus.APPROVED);
        item.setApprovedById(userId);
        item.setApprovedAt(Instant.now());
        item.setRejectionReason(null);
        item = itemRepository.save(item);

        auditService.logStatusChange("CommercialProposalItem", itemId,
                oldStatus.name(), ProposalItemStatus.APPROVED.name());

        log.info("КП позиция согласована: {} в КП {}", itemId, proposalId);
        return toItemResponse(item);
    }

    @Transactional
    public CommercialProposalItemResponse rejectItem(UUID proposalId, UUID itemId, String reason) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getProposalOrThrow(proposalId, organizationId);
        CommercialProposalItem item = getItemOrThrow(proposalId, itemId);

        item.setStatus(ProposalItemStatus.UNPROCESSED);
        item.setRejectionReason(reason);
        item.setApprovedById(null);
        item.setApprovedAt(null);
        item = itemRepository.save(item);

        auditService.logUpdate("CommercialProposalItem", itemId,
                "rejectionReason", null, reason);

        log.info("КП позиция отклонена: {} в КП {} — {}", itemId, proposalId, reason);
        return toItemResponse(item);
    }

    // ── Confirm All ─────────────────────────────────────────────────────────────

    @Transactional
    public CommercialProposalResponse confirmAll(UUID proposalId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal proposal = getProposalOrThrow(proposalId, organizationId);
        if (proposal.getStatus() != ProposalStatus.IN_REVIEW) {
            throw new IllegalStateException("Подтверждение позиций доступно только для КП в статусе «На рассмотрении»");
        }

        List<CommercialProposalItem> confirmedItems = itemRepository.findByProposalId(proposalId)
                .stream()
                .filter(item -> item.getStatus() == ProposalItemStatus.APPROVED
                        || item.getStatus() == ProposalItemStatus.APPROVED_PROJECT)
                .toList();

        if (confirmedItems.isEmpty()) {
            throw new IllegalStateException(
                    "Нет позиций со статусом «Согласовано» для подтверждения");
        }

        for (CommercialProposalItem cpItem : confirmedItems) {
            cpItem.setStatus(ProposalItemStatus.IN_FINANCIAL_MODEL);
            itemRepository.save(cpItem);
        }

        // Recalculate total
        recalculateProposalTotal(proposalId);

        // Refresh entity after recalculation
        proposal = proposalRepository.findByIdAndDeletedFalse(proposalId)
                .orElseThrow(() -> new EntityNotFoundException("КП не найдено: " + proposalId));

        auditService.logUpdate("CommercialProposal", proposalId,
                "confirmAll", null, confirmedItems.size() + " items confirmed");

        log.info("КП подтверждено: {} позиций из КП {}", confirmedItems.size(), proposalId);
        return CommercialProposalResponse.fromEntity(proposal);
    }

    // ── Select Price From Competitive List ──────────────────────────────────────

    @Transactional
    public CommercialProposalItemResponse selectPriceFromCL(UUID proposalId, UUID itemId, UUID clEntryId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getProposalOrThrow(proposalId, organizationId);
        CommercialProposalItem item = getItemOrThrow(proposalId, itemId);

        CompetitiveListEntry entry = competitiveListEntryRepository.findById(clEntryId)
                .orElseThrow(() -> new EntityNotFoundException("Запись КЛ не найдена: " + clEntryId));

        item.setCompetitiveListEntryId(clEntryId);
        item.setCompetitiveListId(entry.getCompetitiveListId());
        item.setSpecItemId(entry.getSpecItemId());
        item.setSelectedInvoiceLineId(entry.getInvoiceLineId());
        item.setUnitPrice(entry.getUnitPrice());
        item.setVendorName(entry.getVendorName());
        item.setCostPrice(entry.getUnitPrice() != null ? entry.getUnitPrice() : BigDecimal.ZERO);

        if (entry.getQuantity() != null && entry.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
            item.setQuantity(entry.getQuantity());
        }

        item.setStatus(ProposalItemStatus.PRICE_SELECTED);
        recalculateItemTotalCost(item);
        item = itemRepository.save(item);
        recalculateProposalTotal(proposalId);

        auditService.logUpdate("CommercialProposalItem", itemId,
                "competitiveListEntryId", null, clEntryId.toString());

        log.info("КП позиция — цена из КЛ: {} → entry {} в КП {}", itemId, clEntryId, proposalId);
        return toItemResponse(item);
    }

    // ── Push to Financial Model ──────────────────────────────────────────────────

    @Transactional
    public CommercialProposalResponse pushToFinancialModel(UUID proposalId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal proposal = getProposalOrThrow(proposalId, organizationId);
        UUID budgetId = proposal.getBudgetId();
        var budget = budgetRepository.findByIdAndDeletedFalse(budgetId)
                .orElseThrow(() -> new EntityNotFoundException("Бюджет не найден: " + budgetId));

        if (proposal.getStatus() != ProposalStatus.APPROVED && proposal.getStatus() != ProposalStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Перенос в ФМ доступен только для утверждённых КП");
        }
        if (budget.getStatus() == BudgetStatus.FROZEN || budget.getStatus() == BudgetStatus.CLOSED) {
            throw new IllegalStateException("Нельзя переносить в ФМ: бюджет заморожен или закрыт");
        }

        List<CommercialProposalItem> confirmedItems = itemRepository.findByProposalId(proposalId)
                .stream()
                .filter(i -> i.getStatus() == ProposalItemStatus.IN_FINANCIAL_MODEL
                        || i.getStatus() == ProposalItemStatus.APPROVED
                        || i.getStatus() == ProposalItemStatus.CONFIRMED
                        || i.getStatus() == ProposalItemStatus.APPROVED_PROJECT)
                .toList();

        if (confirmedItems.isEmpty()) {
            throw new IllegalStateException("Нет подтверждённых позиций для переноса в ФМ");
        }

        BigDecimal totalCustomerPrice = BigDecimal.ZERO;
        BigDecimal totalCostPrice = BigDecimal.ZERO;

        for (CommercialProposalItem cpItem : confirmedItems) {
            validateReadyForPushToFinancialModel(cpItem);
            BudgetItem budgetItem = budgetItemRepository.findById(cpItem.getBudgetItemId())
                    .filter(bi -> !bi.isDeleted())
                    .orElseThrow(() -> new EntityNotFoundException("Позиция ФМ не найдена: " + cpItem.getBudgetItemId()));
            budgetItem.setCostPrice(cpItem.getCostPrice());

            BudgetItemPriceSource priceSource;
            UUID priceSourceId;
            if (cpItem.getCompetitiveListEntryId() != null) {
                priceSource = BudgetItemPriceSource.COMPETITIVE_LIST;
                priceSourceId = cpItem.getCompetitiveListEntryId();
            } else if ("MATERIAL".equals(cpItem.getItemType())) {
                priceSource = BudgetItemPriceSource.INVOICE;
                priceSourceId = cpItem.getSelectedInvoiceLineId();
            } else {
                if (cpItem.getEstimateItemId() != null) {
                    priceSource = BudgetItemPriceSource.ESTIMATE;
                    priceSourceId = cpItem.getEstimateItemId();
                } else {
                    priceSource = BudgetItemPriceSource.MANUAL;
                    priceSourceId = null;
                }
            }

            budgetItem.setPriceSourceType(priceSource);
            budgetItem.setPriceSourceId(priceSourceId);
            budgetItem.recalculatePrices();
            budgetItem.recalculateMargin();
            budgetItemRepository.save(budgetItem);

            totalCostPrice = totalCostPrice.add(
                    cpItem.getTotalCost() != null ? cpItem.getTotalCost() : BigDecimal.ZERO);

            // Estimate customer price from budget item
            BudgetItem bi = budgetItemRepository.findById(cpItem.getBudgetItemId())
                    .filter(found -> !found.isDeleted())
                    .orElse(null);
            if (bi != null && !bi.isDeleted()) {
                BigDecimal custPrice = bi.getCustomerPrice() != null ? bi.getCustomerPrice() : BigDecimal.ZERO;
                BigDecimal qty = bi.getQuantity() != null ? bi.getQuantity() : BigDecimal.ONE;
                totalCustomerPrice = totalCustomerPrice.add(custPrice.multiply(qty));
            }
        }

        proposal.setTotalCostPrice(totalCostPrice);
        proposal.setTotalCustomerPrice(totalCustomerPrice);
        proposal.setTotalMargin(totalCustomerPrice.subtract(totalCostPrice));
        if (totalCustomerPrice.compareTo(BigDecimal.ZERO) != 0) {
            proposal.setMarginPercent(
                    proposal.getTotalMargin()
                            .multiply(new BigDecimal("100"))
                            .divide(totalCustomerPrice, 4, RoundingMode.HALF_UP));
        }

        proposal = proposalRepository.save(proposal);

        auditService.logUpdate("CommercialProposal", proposalId,
                "pushToFM", null, confirmedItems.size() + " items pushed");

        log.info("КП → ФМ: {} позиций из КП {}", confirmedItems.size(), proposalId);
        return CommercialProposalResponse.fromEntity(proposal);
    }

    // ── Private Helpers ─────────────────────────────────────────────────────────

    private CommercialProposal getProposalOrThrow(UUID id, UUID organizationId) {
        CommercialProposal proposal = proposalRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("КП не найдено: " + id));
        if (!organizationId.equals(proposal.getOrganizationId())) {
            throw new EntityNotFoundException("КП не найдено: " + id);
        }
        return proposal;
    }

    private CommercialProposalItem getItemOrThrow(UUID proposalId, UUID itemId) {
        CommercialProposalItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Позиция КП не найдена: " + itemId));
        if (!item.getProposalId().equals(proposalId)) {
            throw new IllegalArgumentException("Позиция не принадлежит указанному КП");
        }
        return item;
    }

    private void recalculateItemTotalCost(CommercialProposalItem item) {
        BigDecimal costPrice = item.getCostPrice() != null ? item.getCostPrice() : BigDecimal.ZERO;
        BigDecimal quantity = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
        item.setTotalCost(costPrice.multiply(quantity)
                .setScale(2, RoundingMode.HALF_UP));
    }

    private void recalculateProposalTotal(UUID proposalId) {
        List<CommercialProposalItem> allItems = itemRepository.findByProposalId(proposalId);
        BigDecimal total = allItems.stream()
                .map(i -> i.getTotalCost() != null ? i.getTotalCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        proposalRepository.findByIdAndDeletedFalse(proposalId).ifPresent(proposal -> {
            proposal.setTotalCostPrice(total);
            proposalRepository.save(proposal);
        });
    }

    private CommercialProposalItemResponse toItemResponse(CommercialProposalItem item) {
        BudgetItem budgetItem = null;
        if (item.getBudgetItemId() != null) {
            budgetItem = budgetItemRepository.findById(item.getBudgetItemId())
                    .filter(found -> !found.isDeleted())
                    .orElse(null);
        }
        return CommercialProposalItemResponse.fromEntity(item, budgetItem);
    }

    private List<CommercialProposalItemResponse> toItemResponses(List<CommercialProposalItem> items) {
        Map<UUID, BudgetItem> budgetItemsById = budgetItemRepository.findAllById(
                        items.stream()
                                .map(CommercialProposalItem::getBudgetItemId)
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList())
                .stream()
                .filter(item -> !item.isDeleted())
                .collect(Collectors.toMap(BudgetItem::getId, Function.identity()));

        return items.stream()
                .map(item -> CommercialProposalItemResponse.fromEntity(item, budgetItemsById.get(item.getBudgetItemId())))
                .toList();
    }

    private String mapBudgetItemType(BudgetItemType type) {
        if (type == null) {
            return "WORK";
        }
        return switch (type) {
            case MATERIALS, EQUIPMENT -> "MATERIAL";
            case WORKS, OVERHEAD, OTHER -> "WORK";
        };
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

    private InvoiceLine loadInvoiceLineOrThrow(UUID invoiceLineId) {
        return invoiceLineRepository.findById(invoiceLineId)
                .filter(line -> !line.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка счёта не найдена: " + invoiceLineId));
    }

    private EstimateItem loadEstimateItemOrThrow(UUID estimateItemId) {
        return estimateItemRepository.findById(estimateItemId)
                .filter(item -> !item.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция сметы не найдена: " + estimateItemId));
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void validateReadyForPushToFinancialModel(CommercialProposalItem cpItem) {
        if (cpItem.getBudgetItemId() == null) {
            throw new IllegalStateException("Позиция КП не привязана к позиции ФМ");
        }
        if (cpItem.getStatus() != ProposalItemStatus.IN_FINANCIAL_MODEL
                && cpItem.getStatus() != ProposalItemStatus.APPROVED
                && cpItem.getStatus() != ProposalItemStatus.CONFIRMED
                && cpItem.getStatus() != ProposalItemStatus.APPROVED_PROJECT) {
            throw new IllegalStateException("Позиция КП не готова к переносу в ФМ");
        }
        if (cpItem.getCostPrice() == null || cpItem.getCostPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("У позиции КП отсутствует валидная себестоимость");
        }
        if (!"MATERIAL".equals(cpItem.getItemType())) {
            if ("WORK".equals(cpItem.getItemType())
                    && cpItem.getEstimateItemId() == null
                    && cpItem.getCostPrice() == null) {
                throw new IllegalStateException("Для работ требуется смета или ручная себестоимость");
            }
            return;
        }

        UUID selectedInvoiceLineId = cpItem.getSelectedInvoiceLineId();
        UUID competitiveListEntryId = cpItem.getCompetitiveListEntryId();
        if (selectedInvoiceLineId == null && competitiveListEntryId == null) {
            throw new IllegalStateException(
                    "Для переноса материала в ФМ требуется привязка к счету или конкурентному листу");
        }

        if (selectedInvoiceLineId != null) {
            assertInvoiceApprovedForCostByLineId(selectedInvoiceLineId);
            return;
        }

        CompetitiveListEntry entry = competitiveListEntryRepository.findById(competitiveListEntryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Запись конкурентного листа не найдена: " + competitiveListEntryId));
        if (entry.getInvoiceLineId() != null) {
            assertInvoiceApprovedForCostByLineId(entry.getInvoiceLineId());
            return;
        }
        if (entry.getInvoiceId() != null) {
            assertInvoiceApprovedForCostByInvoiceId(entry.getInvoiceId());
            return;
        }
        throw new IllegalStateException(
                "Для переноса материала в ФМ запись КЛ должна быть связана с согласованным счётом");
    }

    private void assertInvoiceApprovedForCostByLineId(UUID invoiceLineId) {
        InvoiceLine line = loadInvoiceLineOrThrow(invoiceLineId);
        if (line.getQuantity() == null || line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Строка счёта имеет невалидное количество");
        }
        assertInvoiceApprovedForCostByInvoiceId(line.getInvoiceId());
    }

    private void assertInvoiceApprovedForCostByInvoiceId(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndDeletedFalse(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Счёт не найден: " + invoiceId));
        if (!isApprovedInvoiceStatus(invoice.getStatus())) {
            throw new IllegalStateException(
                    "Себестоимость материала переносится в ФМ только из согласованных счетов");
        }
    }

    private boolean isApprovedInvoiceStatus(InvoiceStatus status) {
        return status == InvoiceStatus.ON_APPROVAL
                || status == InvoiceStatus.APPROVED
                || status == InvoiceStatus.PARTIALLY_PAID
                || status == InvoiceStatus.PAID
                || status == InvoiceStatus.OVERDUE
                || status == InvoiceStatus.CLOSED;
    }

    // ======================== Versioning (Phase 10) ========================

    @Transactional
    public CommercialProposal createVersion(UUID cpId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal original = getProposalOrThrow(cpId, organizationId);
        original.setCurrent(false);
        proposalRepository.save(original);

        CommercialProposal newVersion = CommercialProposal.builder()
                .organizationId(original.getOrganizationId())
                .projectId(original.getProjectId())
                .budgetId(original.getBudgetId())
                .name(original.getName())
                .status(ProposalStatus.DRAFT)
                .totalCostPrice(original.getTotalCostPrice())
                .totalCustomerPrice(original.getTotalCustomerPrice())
                .totalMargin(original.getTotalMargin())
                .marginPercent(original.getMarginPercent())
                .specificationId(original.getSpecificationId())
                .notes(original.getNotes())
                .docVersion(original.getDocVersion() + 1)
                .parentVersionId(original.getId())
                .current(true)
                .companyName(original.getCompanyName())
                .companyInn(original.getCompanyInn())
                .companyKpp(original.getCompanyKpp())
                .companyAddress(original.getCompanyAddress())
                .signatoryName(original.getSignatoryName())
                .signatoryPosition(original.getSignatoryPosition())
                .build();
        newVersion = proposalRepository.save(newVersion);

        // Copy items
        List<CommercialProposalItem> originalItems = itemRepository.findByProposalId(cpId);
        UUID newCpId = newVersion.getId();
        List<CommercialProposalItem> copiedItems = originalItems.stream().map(item ->
                CommercialProposalItem.builder()
                        .proposalId(newCpId)
                        .budgetItemId(item.getBudgetItemId())
                        .itemType(item.getItemType())
                        .selectedInvoiceLineId(item.getSelectedInvoiceLineId())
                        .estimateItemId(item.getEstimateItemId())
                        .tradingCoefficient(item.getTradingCoefficient())
                        .costPrice(item.getCostPrice())
                        .quantity(item.getQuantity())
                        .totalCost(item.getTotalCost())
                        .status(ProposalItemStatus.UNPROCESSED)
                        .competitiveListEntryId(item.getCompetitiveListEntryId())
                        .competitiveListId(item.getCompetitiveListId())
                        .specItemId(item.getSpecItemId())
                        .unitPrice(item.getUnitPrice())
                        .unit(item.getUnit())
                        .vendorName(item.getVendorName())
                        .bidComparisonId(item.getBidComparisonId())
                        .bidWinnerVendorId(item.getBidWinnerVendorId())
                        .build()
        ).toList();
        itemRepository.saveAll(copiedItems);

        log.info("Created version {} for CP {} -> {}", newVersion.getDocVersion(), cpId, newVersion.getId());
        return newVersion;
    }

    @Transactional
    public CommercialProposal updateCompanyDetails(UUID cpId, String companyName, String companyInn,
                                                    String companyKpp, String companyAddress,
                                                    String signatoryName, String signatoryPosition) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CommercialProposal cp = getProposalOrThrow(cpId, organizationId);
        if (companyName != null) cp.setCompanyName(companyName);
        if (companyInn != null) cp.setCompanyInn(companyInn);
        if (companyKpp != null) cp.setCompanyKpp(companyKpp);
        if (companyAddress != null) cp.setCompanyAddress(companyAddress);
        if (signatoryName != null) cp.setSignatoryName(signatoryName);
        if (signatoryPosition != null) cp.setSignatoryPosition(signatoryPosition);
        return proposalRepository.save(cp);
    }

    // ======================== Apply Bid Winner to CP (Phase 7) ========================

    @Transactional
    public int applyBidWinnerToCp(UUID cpId, UUID bidComparisonId, UUID winnerVendorId,
                                   java.math.BigDecimal winnerCostPrice) {
        List<CommercialProposalItem> workItems = itemRepository.findByProposalId(cpId).stream()
                .filter(item -> "WORK".equals(item.getItemType()))
                .toList();

        int count = 0;
        for (CommercialProposalItem item : workItems) {
            if (item.getBidComparisonId() == null) {
                item.setBidComparisonId(bidComparisonId);
                item.setBidWinnerVendorId(winnerVendorId);
                item.setCostPrice(winnerCostPrice);
                item.setTotalCost(winnerCostPrice.multiply(item.getQuantity()));
                item.setStatus(ProposalItemStatus.PRICE_SELECTED);
                itemRepository.save(item);
                count++;
            }
        }

        log.info("Applied bid winner {} to {} work items in CP {}", winnerVendorId, count, cpId);
        return count;
    }
}
