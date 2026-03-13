package com.privod.platform.modules.integration1c.service;

import com.privod.platform.infrastructure.finance.VatCalculator;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks3Document;
import com.privod.platform.modules.finance.domain.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Utility class for converting PRIVOD entities to/from 1С:Бухгалтерия XML format.
 * <p>
 * The XML structures follow the 1C:Enterprise 8 data exchange standard (CommerceML-like).
 * Actual field mapping will be refined when a test 1C instance is available.
 */
public final class Integration1cMapper {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private Integration1cMapper() {
    }

    /**
     * Convert a PRIVOD Invoice entity to 1С:Бухгалтерия XML format.
     * Produces a simplified representation of "Документ.РеализацияТоваровУслуг" (Sales of Goods and Services).
     */
    public static String invoiceTo1cXml(Invoice invoice) {
        BigDecimal totalAmount = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal vatAmount = VatCalculator.vatAmount(totalAmount);

        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <v8:CatalogObject xmlns:v8="http://v8.1c.ru/data">
                  <v8:Ref>%s</v8:Ref>
                  <v8:DeletionMark>false</v8:DeletionMark>
                  <v8:DocumentType>РеализацияТоваровУслуг</v8:DocumentType>
                  <v8:Number>%s</v8:Number>
                  <v8:Date>%s</v8:Date>
                  <v8:Сумма>%s</v8:Сумма>
                  <v8:СуммаНДС>%s</v8:СуммаНДС>
                  <v8:СтавкаНДС>%d</v8:СтавкаНДС>
                  <v8:Комментарий>Exported from PRIVOD Platform</v8:Комментарий>
                </v8:CatalogObject>
                """.formatted(
                invoice.getId() != null ? invoice.getId().toString() : UUID.randomUUID().toString(),
                invoice.getNumber() != null ? escapeXml(invoice.getNumber()) : "",
                invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : "",
                totalAmount.toPlainString(),
                vatAmount.toPlainString(),
                VatCalculator.DEFAULT_RATE.intValue()
        );
    }

    /**
     * Convert a PRIVOD KS-2 act to 1С XML format.
     * Produces a "Документ.АктВыполненныхРабот" (Act of Completed Works).
     */
    public static String ks2To1cXml(Ks2Document ks2) {
        BigDecimal total = ks2.getTotalAmount() != null ? ks2.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal totalWithVat = ks2.getTotalWithVat() != null ? ks2.getTotalWithVat() : total;
        BigDecimal vatAmount = ks2.getTotalVatAmount() != null ? ks2.getTotalVatAmount() : BigDecimal.ZERO;

        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <v8:CatalogObject xmlns:v8="http://v8.1c.ru/data">
                  <v8:Ref>%s</v8:Ref>
                  <v8:DeletionMark>false</v8:DeletionMark>
                  <v8:DocumentType>АктВыполненныхРабот</v8:DocumentType>
                  <v8:Number>%s</v8:Number>
                  <v8:Date>%s</v8:Date>
                  <v8:СуммаБезНДС>%s</v8:СуммаБезНДС>
                  <v8:СуммаНДС>%s</v8:СуммаНДС>
                  <v8:СуммаСНДС>%s</v8:СуммаСНДС>
                  <v8:СтавкаНДС>%d</v8:СтавкаНДС>
                  <v8:Комментарий>КС-2 exported from PRIVOD Platform</v8:Комментарий>
                </v8:CatalogObject>
                """.formatted(
                ks2.getId() != null ? ks2.getId().toString() : UUID.randomUUID().toString(),
                escapeXml(ks2.getNumber()),
                ks2.getDocumentDate() != null ? ks2.getDocumentDate().format(DATE_FMT) : "",
                total.toPlainString(),
                vatAmount.toPlainString(),
                totalWithVat.toPlainString(),
                VatCalculator.DEFAULT_RATE.intValue()
        );
    }

    /**
     * Convert a PRIVOD KS-3 certificate to 1С XML format.
     */
    public static String ks3To1cXml(Ks3Document ks3) {
        BigDecimal total = ks3.getTotalAmount() != null ? ks3.getTotalAmount() : BigDecimal.ZERO;

        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <v8:CatalogObject xmlns:v8="http://v8.1c.ru/data">
                  <v8:Ref>%s</v8:Ref>
                  <v8:DeletionMark>false</v8:DeletionMark>
                  <v8:DocumentType>СправкаОСтоимостиВыполненныхРабот</v8:DocumentType>
                  <v8:Number>%s</v8:Number>
                  <v8:Date>%s</v8:Date>
                  <v8:Сумма>%s</v8:Сумма>
                  <v8:Комментарий>КС-3 exported from PRIVOD Platform</v8:Комментарий>
                </v8:CatalogObject>
                """.formatted(
                ks3.getId() != null ? ks3.getId().toString() : UUID.randomUUID().toString(),
                escapeXml(ks3.getNumber()),
                ks3.getDocumentDate() != null ? ks3.getDocumentDate().format(DATE_FMT) : "",
                total.toPlainString()
        );
    }

    /**
     * Parse a counterparty from 1C XML format.
     * Returns a simple array: [name, inn, kpp, address].
     * <p>
     * This is a stub parser — actual 1C XML structure will vary by configuration.
     */
    public static String[] counterpartyFrom1cXml(String xml) {
        String name = extractXmlValue(xml, "Наименование");
        String inn = extractXmlValue(xml, "ИНН");
        String kpp = extractXmlValue(xml, "КПП");
        String address = extractXmlValue(xml, "ЮридическийАдрес");
        return new String[]{name, inn, kpp, address};
    }

    // --- internal helpers ---

    private static String extractXmlValue(String xml, String tag) {
        String openTag = "<v8:" + tag + ">";
        String closeTag = "</v8:" + tag + ">";
        int start = xml.indexOf(openTag);
        if (start == -1) {
            // try without namespace
            openTag = "<" + tag + ">";
            closeTag = "</" + tag + ">";
            start = xml.indexOf(openTag);
        }
        if (start == -1) return "";
        start += openTag.length();
        int end = xml.indexOf(closeTag, start);
        if (end == -1) return "";
        return xml.substring(start, end).trim();
    }

    private static String escapeXml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
