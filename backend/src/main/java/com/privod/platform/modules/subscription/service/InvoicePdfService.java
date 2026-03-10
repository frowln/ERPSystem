package com.privod.platform.modules.subscription.service;

import com.privod.platform.infrastructure.report.PdfReportService;
import com.privod.platform.modules.subscription.domain.BillingRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Service for generating PDF invoices ("Счёт на оплату") from BillingRecord data.
 * Uses the shared PdfReportService (Thymeleaf + Flying Saucer / OpenPDF)
 * with the {@code reports/billing-invoice} template.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoicePdfService {

    private static final String TEMPLATE_NAME = "reports/billing-invoice";
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy").withZone(ZoneId.of("Europe/Moscow"));

    private final PdfReportService pdfReportService;

    /**
     * Generate a PDF invoice for the given billing record.
     *
     * @param record           the billing record to render
     * @param organizationName display name of the paying organization
     * @return PDF content as a byte array
     */
    public byte[] generateInvoicePdf(BillingRecord record, String organizationName) {
        log.info("Generating invoice PDF for record id={}, invoice={}", record.getId(), record.getInvoiceNumber());

        Map<String, Object> data = new HashMap<>();

        // Invoice identification
        data.put("invoiceNumber", record.getInvoiceNumber());
        data.put("invoiceDate", formatDate(record.getInvoiceDate()));

        // Organization
        data.put("organizationName", organizationName);

        // Plan info
        data.put("planDisplayName", record.getPlanDisplayName());
        data.put("description", record.getDescription());

        // Period
        data.put("periodStart", formatDate(record.getPeriodStart()));
        data.put("periodEnd", formatDate(record.getPeriodEnd()));

        // Billing type
        data.put("billingTypeDisplayName", record.getBillingType().getDisplayName());

        // Amount
        data.put("amount", record.getAmount());
        data.put("formattedAmount", formatAmount(record.getAmount()));
        data.put("currency", record.getCurrency());

        // Payment status
        data.put("paymentStatus", record.getPaymentStatus().name());
        data.put("paymentStatusDisplayName", record.getPaymentStatus().getDisplayName());

        // Paid date (may be null)
        data.put("paidDate", formatDate(record.getPaidDate()));

        return pdfReportService.generateReport(TEMPLATE_NAME, data);
    }

    private String formatDate(Instant instant) {
        if (instant == null) {
            return null;
        }
        return DATE_FMT.format(instant);
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("ru", "RU"));
        symbols.setGroupingSeparator(' ');
        symbols.setDecimalSeparator('.');
        DecimalFormat fmt = new DecimalFormat("#,##0.00", symbols);
        return fmt.format(amount);
    }
}
