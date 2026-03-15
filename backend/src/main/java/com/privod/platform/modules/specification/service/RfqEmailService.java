package com.privod.platform.modules.specification.service;

import com.privod.platform.infrastructure.email.EmailService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.Counterparty;
import com.privod.platform.modules.accounting.repository.CounterpartyRepository;
import com.privod.platform.modules.specification.domain.CompetitiveList;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.repository.CompetitiveListRepository;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Sends RFQ (Request for Quotation) emails to suppliers based on a competitive list.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RfqEmailService {

    private final CompetitiveListRepository competitiveListRepository;
    private final SpecItemRepository specItemRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final EmailService emailService;

    /**
     * Generate and send RFQ emails to selected suppliers for a given competitive list.
     *
     * @param competitiveListId the competitive list containing the materials
     * @param supplierIds       list of counterparty (supplier) IDs to send RFQ to
     */
    @Transactional(readOnly = true)
    public void sendRfqByEmail(UUID competitiveListId, List<UUID> supplierIds) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        CompetitiveList cl = competitiveListRepository.findByIdAndDeletedFalse(competitiveListId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Конкурентный лист не найден: " + competitiveListId));

        // Load spec items for the competitive list's specification
        List<SpecItem> specItems = specItemRepository
                .findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(cl.getSpecificationId());

        if (specItems.isEmpty()) {
            throw new IllegalStateException("В спецификации нет позиций для запроса цен");
        }

        // Build material list for the email template
        List<Map<String, Object>> materialRows = new ArrayList<>();
        int rowNum = 1;
        for (SpecItem item : specItems) {
            Map<String, Object> row = new HashMap<>();
            row.put("number", rowNum++);
            row.put("name", item.getName());
            row.put("brand", item.getBrand() != null ? item.getBrand() : "—");
            row.put("unit", item.getUnitOfMeasure());
            row.put("quantity", item.getQuantity());
            row.put("productCode", item.getProductCode() != null ? item.getProductCode() : "—");
            materialRows.add(row);
        }

        // Load suppliers and send emails
        int sentCount = 0;
        for (UUID supplierId : supplierIds) {
            Counterparty supplier = counterpartyRepository
                    .findByIdAndOrganizationIdAndDeletedFalse(supplierId, organizationId)
                    .orElse(null);

            if (supplier == null) {
                log.warn("Поставщик не найден или не принадлежит организации: {}", supplierId);
                continue;
            }

            if (supplier.getEmail() == null || supplier.getEmail().isBlank()) {
                log.warn("У поставщика {} отсутствует email, пропускаем", supplier.getName());
                continue;
            }

            Map<String, Object> templateVars = new HashMap<>();
            templateVars.put("supplierName", supplier.getName());
            templateVars.put("contactPerson", supplier.getContactPerson() != null ? supplier.getContactPerson() : supplier.getName());
            templateVars.put("competitiveListName", cl.getName());
            templateVars.put("materials", materialRows);
            templateVars.put("totalPositions", specItems.size());
            templateVars.put("notes", cl.getNotes() != null ? cl.getNotes() : "");

            try {
                emailService.sendEmailAsync(
                        supplier.getEmail(),
                        "Запрос коммерческого предложения: " + cl.getName(),
                        "email/rfq-request",
                        templateVars
                );
                sentCount++;
                log.info("RFQ email sent to {} ({}) for competitive list {}",
                        supplier.getName(), supplier.getEmail(), competitiveListId);
            } catch (Exception e) {
                log.error("Не удалось отправить RFQ email поставщику {} ({}): {}",
                        supplier.getName(), supplier.getEmail(), e.getMessage());
            }
        }

        log.info("RFQ emails sent: {}/{} for competitive list {}",
                sentCount, supplierIds.size(), competitiveListId);
    }
}
