package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.finance.domain.CashFlowEntry;
import com.privod.platform.modules.finance.repository.CashFlowEntryRepository;
import com.privod.platform.modules.finance.web.dto.CashFlowEntryResponse;
import com.privod.platform.modules.finance.web.dto.CashFlowSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateCashFlowEntryRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashFlowService {

    private final CashFlowEntryRepository cashFlowEntryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CashFlowEntryResponse> listEntries(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return cashFlowEntryRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(CashFlowEntryResponse::fromEntity);
        }
        return cashFlowEntryRepository.findAll(pageable).map(CashFlowEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CashFlowEntryResponse getEntry(UUID id) {
        CashFlowEntry entry = getEntryOrThrow(id);
        return CashFlowEntryResponse.fromEntity(entry);
    }

    @Transactional
    public CashFlowEntryResponse createEntry(CreateCashFlowEntryRequest request) {
        CashFlowEntry entry = CashFlowEntry.builder()
                .projectId(request.projectId())
                .entryDate(request.entryDate())
                .direction(request.direction())
                .category(request.category())
                .amount(request.amount())
                .description(request.description())
                .paymentId(request.paymentId())
                .invoiceId(request.invoiceId())
                .notes(request.notes())
                .build();

        entry = cashFlowEntryRepository.save(entry);
        auditService.logCreate("CashFlowEntry", entry.getId());

        log.info("Запись движения денежных средств создана: {} {} ({})",
                entry.getDirection(), entry.getAmount(), entry.getId());
        return CashFlowEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteEntry(UUID id) {
        CashFlowEntry entry = getEntryOrThrow(id);
        entry.softDelete();
        cashFlowEntryRepository.save(entry);
        auditService.logDelete("CashFlowEntry", id);

        log.info("Запись движения денежных средств удалена: {}", id);
    }

    @Transactional(readOnly = true)
    public List<CashFlowEntryResponse> getProjectCashFlow(UUID projectId, LocalDate dateFrom, LocalDate dateTo) {
        return cashFlowEntryRepository.findByProjectIdAndDateRange(projectId, dateFrom, dateTo)
                .stream()
                .map(CashFlowEntryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CashFlowSummaryResponse getCashFlowSummary(UUID projectId) {
        BigDecimal totalInflow = cashFlowEntryRepository.sumByProjectIdAndDirection(projectId, "in");
        BigDecimal totalOutflow = cashFlowEntryRepository.sumByProjectIdAndDirection(projectId, "out");

        BigDecimal inflow = totalInflow != null ? totalInflow : BigDecimal.ZERO;
        BigDecimal outflow = totalOutflow != null ? totalOutflow : BigDecimal.ZERO;

        // Monthly breakdown
        List<Object[]> monthlyData = cashFlowEntryRepository.getMonthlySummaryByProjectId(projectId);
        Map<String, BigDecimal[]> monthlyMap = new HashMap<>();

        for (Object[] row : monthlyData) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String direction = (String) row[2];
            BigDecimal amount = (BigDecimal) row[3];

            String key = year + "-" + month;
            monthlyMap.computeIfAbsent(key, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});

            if ("in".equals(direction)) {
                monthlyMap.get(key)[0] = amount;
            } else {
                monthlyMap.get(key)[1] = amount;
            }
        }

        List<CashFlowSummaryResponse.MonthlyCashFlow> monthlyBreakdown = new ArrayList<>();
        monthlyMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    String[] parts = entry.getKey().split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    BigDecimal monthIn = entry.getValue()[0];
                    BigDecimal monthOut = entry.getValue()[1];
                    monthlyBreakdown.add(new CashFlowSummaryResponse.MonthlyCashFlow(
                            year, month, monthIn, monthOut, monthIn.subtract(monthOut)));
                });

        return new CashFlowSummaryResponse(inflow, outflow, inflow.subtract(outflow), monthlyBreakdown);
    }

    private CashFlowEntry getEntryOrThrow(UUID id) {
        return cashFlowEntryRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись движения денежных средств не найдена: " + id));
    }
}
