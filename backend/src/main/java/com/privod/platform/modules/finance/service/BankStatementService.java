package com.privod.platform.modules.finance.service;

import com.privod.platform.modules.finance.web.dto.BankTransactionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for parsing bank statements (1C DirectBank, CSV) and matching transactions to invoices.
 * Currently implements a stub parser that returns parsed line items.
 * In production this should support 1C DirectBank XML format and standard CSV bank exports.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BankStatementService {

    /**
     * Upload and parse a bank statement file.
     * Supports CSV format with columns: date, description, amount, direction, counterparty, inn, account, purpose.
     * Returns parsed transactions with auto-generated IDs.
     */
    public List<BankTransactionResponse> uploadAndParse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Файл банковской выписки не может быть пустым");
        }

        String filename = file.getOriginalFilename();
        log.info("Parsing bank statement: {}, size: {} bytes", filename, file.getSize());

        List<BankTransactionResponse> transactions = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header row
                }

                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                String[] parts = trimmed.split("[;,\t]", -1);
                if (parts.length < 4) continue;

                try {
                    LocalDate date = LocalDate.parse(parts[0].trim());
                    String description = parts.length > 1 ? parts[1].trim() : "";
                    BigDecimal amount = new BigDecimal(parts[2].trim().replace(" ", "").replace(",", "."));
                    String direction = parts.length > 3 ? parts[3].trim() : "in";
                    String counterpartyName = parts.length > 4 ? parts[4].trim() : "";
                    String counterpartyInn = parts.length > 5 ? parts[5].trim() : "";
                    String counterpartyAccount = parts.length > 6 ? parts[6].trim() : "";
                    String paymentPurpose = parts.length > 7 ? parts[7].trim() : description;

                    transactions.add(new BankTransactionResponse(
                            UUID.randomUUID(),
                            date,
                            description,
                            amount,
                            direction,
                            counterpartyName,
                            counterpartyInn,
                            counterpartyAccount,
                            paymentPurpose,
                            "PENDING",
                            null,
                            null
                    ));
                } catch (Exception e) {
                    log.warn("Skipping malformed bank statement line: {}", trimmed, e);
                }
            }
        } catch (Exception e) {
            log.error("Error parsing bank statement file: {}", filename, e);
            throw new IllegalArgumentException("Ошибка при разборе файла выписки: " + e.getMessage());
        }

        log.info("Parsed {} transactions from bank statement {}", transactions.size(), filename);
        return transactions;
    }

    /**
     * Confirm a match between a parsed bank transaction and an invoice.
     * In production this would persist the link and update the invoice's paid amount.
     */
    public BankTransactionResponse confirmMatch(UUID transactionId, UUID invoiceId) {
        log.info("Confirmed match: transaction {} -> invoice {}", transactionId, invoiceId);

        // Stub: return a confirmed transaction response
        return new BankTransactionResponse(
                transactionId,
                LocalDate.now(),
                "Подтверждённая транзакция",
                BigDecimal.ZERO,
                "in",
                "",
                "",
                "",
                "",
                "CONFIRMED",
                invoiceId,
                null
        );
    }

    /**
     * Reject a matched bank transaction.
     * In production this would clear the invoice link.
     */
    public BankTransactionResponse rejectMatch(UUID transactionId) {
        log.info("Rejected match for transaction {}", transactionId);

        // Stub: return a rejected transaction response
        return new BankTransactionResponse(
                transactionId,
                LocalDate.now(),
                "Отклонённая транзакция",
                BigDecimal.ZERO,
                "in",
                "",
                "",
                "",
                "",
                "REJECTED",
                null,
                null
        );
    }
}
