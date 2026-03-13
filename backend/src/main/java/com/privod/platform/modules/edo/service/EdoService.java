package com.privod.platform.modules.edo.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.edo.domain.EdoConfig;
import com.privod.platform.modules.edo.domain.EdoDocument;
import com.privod.platform.modules.edo.domain.EdoDocumentStatus;
import com.privod.platform.modules.edo.repository.EdoConfigRepository;
import com.privod.platform.modules.edo.repository.EdoDocumentRepository;
import com.privod.platform.modules.edo.web.dto.EdoConfigRequest;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Main service for ЭДО (Electronic Document Exchange) operations.
 * <p>
 * Supports sending KS-2, KS-3, invoices, acts, and UPD through
 * Diadok / SBIS / Kontur providers. Currently all provider calls
 * are stubbed — real integration will be added in Phase 4.3.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EdoService {

    private static final DateTimeFormatter UPD_DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter UPD_TIME_FMT = DateTimeFormatter.ofPattern("HH.mm.ss");

    private final EdoConfigRepository edoConfigRepository;
    private final EdoDocumentRepository edoDocumentRepository;
    private final DiadokClient diadokClient;
    private final InvoiceRepository invoiceRepository;

    // ========================================================================
    // Configuration
    // ========================================================================

    @Transactional(readOnly = true)
    public EdoConfig getConfig(UUID orgId) {
        return edoConfigRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ЭДО конфигурация не найдена для организации: " + orgId));
    }

    @Transactional
    public EdoConfig saveConfig(EdoConfigRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        EdoConfig config = edoConfigRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .orElseGet(() -> EdoConfig.builder()
                        .organizationId(orgId)
                        .build());

        config.setProvider(request.provider());
        config.setApiKey(request.apiKey());
        config.setBoxId(request.boxId());
        config.setInn(request.inn());
        config.setKpp(request.kpp());
        config.setEnabled(request.enabled() != null ? request.enabled() : false);

        config = edoConfigRepository.save(config);
        log.info("ЭДО конфигурация сохранена: provider={}, inn={}, enabled={} (orgId={})",
                config.getProvider(), config.getInn(), config.getEnabled(), orgId);
        return config;
    }

    // ========================================================================
    // Send documents
    // ========================================================================

    @Transactional
    public EdoDocument sendKs2(UUID configId, UUID ks2Id) {
        log.info("Отправка КС-2 {} через ЭДО (configId={})", ks2Id, configId);
        return sendDocument(configId, "KS2", ks2Id);
    }

    @Transactional
    public EdoDocument sendKs3(UUID configId, UUID ks3Id) {
        log.info("Отправка КС-3 {} через ЭДО (configId={})", ks3Id, configId);
        return sendDocument(configId, "KS3", ks3Id);
    }

    @Transactional
    public EdoDocument sendInvoice(UUID configId, UUID invoiceId) {
        log.info("Отправка счёта {} через ЭДО (configId={})", invoiceId, configId);
        return sendDocument(configId, "INVOICE", invoiceId);
    }

    // ========================================================================
    // Status & History
    // ========================================================================

    @Transactional
    public EdoDocument checkStatus(UUID edoDocId) {
        EdoDocument doc = getEdoDocumentOrThrow(edoDocId);
        log.info("Проверка статуса ЭДО документа {} (externalId={})", edoDocId, doc.getExternalId());

        if (doc.getExternalId() == null) {
            log.warn("ЭДО документ {} не имеет externalId — статус не может быть проверен", edoDocId);
            return doc;
        }

        // Stub: call Diadok to check status
        String providerStatus = diadokClient.getDocumentStatus(doc.getExternalId());
        log.info("ЭДО провайдер вернул статус '{}' для документа {}", providerStatus, edoDocId);

        EdoDocumentStatus newStatus = mapProviderStatus(providerStatus);
        if (newStatus != doc.getStatus()) {
            EdoDocumentStatus oldStatus = doc.getStatus();
            doc.setStatus(newStatus);

            if (newStatus == EdoDocumentStatus.SIGNED_BY_COUNTERPARTY) {
                doc.setSignedAt(Instant.now());
            }

            doc = edoDocumentRepository.save(doc);
            log.info("Статус ЭДО документа {} изменён: {} → {}", edoDocId, oldStatus, newStatus);
        }

        return doc;
    }

    @Transactional(readOnly = true)
    public byte[] receiveSignedDocument(UUID edoDocId) {
        EdoDocument doc = getEdoDocumentOrThrow(edoDocId);
        log.info("Загрузка подписанного документа ЭДО {} (externalId={})", edoDocId, doc.getExternalId());

        if (doc.getExternalId() == null) {
            throw new IllegalStateException(
                    "ЭДО документ " + edoDocId + " не имеет externalId — загрузка невозможна");
        }

        return diadokClient.downloadSignedDocument(doc.getExternalId());
    }

    @Transactional(readOnly = true)
    public List<EdoDocument> getDocumentHistory(String sourceType, UUID sourceId) {
        log.debug("Запрос истории ЭДО для {}:{}", sourceType, sourceId);
        return edoDocumentRepository.findBySourceTypeAndSourceIdAndDeletedFalse(sourceType, sourceId);
    }

    // ========================================================================
    // УПД XML generation (Приказ ФНС № ЕД-7-26/970@)
    // ========================================================================

    /**
     * Generates a minimal valid УПД (Универсальный передаточный документ) XML
     * conforming to Приказ ФНС России № ЕД-7-26/970@ (format version 5.02).
     * <p>
     * The resulting byte array is UTF-8 encoded XML ready for submission to
     * an ЭДО operator (Диадок / СБИС / Контур).
     *
     * @param invoiceId      UUID of the Invoice to export as УПД
     * @param organizationId UUID of the sending organisation (seller)
     * @return UTF-8 encoded XML bytes
     */
    @Transactional(readOnly = true)
    public byte[] generateUpdXml(UUID invoiceId, UUID organizationId) {
        Invoice invoice = invoiceRepository.findByIdAndDeletedFalse(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceId));

        // Resolve seller INN from EdoConfig when available, fall back to empty string
        String sellerInn = edoConfigRepository.findByOrganizationIdAndDeletedFalse(organizationId)
                .map(c -> c.getInn() != null ? c.getInn() : "")
                .orElse("");
        String sellerKpp = edoConfigRepository.findByOrganizationIdAndDeletedFalse(organizationId)
                .map(c -> c.getKpp() != null ? c.getKpp() : "")
                .orElse("");

        // Buyer info comes from Invoice.partnerName; INN/KPP are not on Invoice entity
        // so we use safe defaults — real integration should resolve from Counterparty
        String buyerName = invoice.getPartnerName() != null ? invoice.getPartnerName() : "";
        String buyerInn  = "";
        String buyerKpp  = "";

        LocalDate docDate = invoice.getInvoiceDate() != null
                ? invoice.getInvoiceDate()
                : LocalDate.now();
        Instant now = Instant.now();
        LocalDate today = now.atZone(ZoneId.systemDefault()).toLocalDate();

        String dateStr     = docDate.format(UPD_DATE_FMT);
        String todayStr    = today.format(UPD_DATE_FMT);
        String timeStr     = now.atZone(ZoneId.systemDefault()).toLocalTime().format(UPD_TIME_FMT);
        String invoiceNum  = invoice.getNumber() != null ? invoice.getNumber() : "";

        // ИдФайл: ON_NSCHFDOPPR_<ИНН_продавца>_<ИНН_покупателя>_<дата YYYYMMDD>_<UUID>
        String idFile = String.format("ON_NSCHFDOPPR_%s_%s_%s_%s",
                sellerInn.isEmpty() ? "0000000000" : sellerInn,
                buyerInn.isEmpty()  ? "0000000000" : buyerInn,
                docDate.format(DateTimeFormatter.BASIC_ISO_DATE),
                UUID.randomUUID());

        BigDecimal subtotal = invoice.getSubtotal() != null
                ? invoice.getSubtotal().setScale(2) : BigDecimal.ZERO.setScale(2);
        BigDecimal vatAmount = invoice.getVatAmount() != null
                ? invoice.getVatAmount().setScale(2) : BigDecimal.ZERO.setScale(2);
        BigDecimal totalWithVat = invoice.getTotalAmount() != null
                ? invoice.getTotalAmount().setScale(2) : BigDecimal.ZERO.setScale(2);

        String vatRateLabel = "20%";
        if (invoice.getVatRate() != null) {
            int rateInt = invoice.getVatRate().intValue();
            vatRateLabel = rateInt == 0 ? "без НДС" : rateInt + "%";
        }

        // Document name for УПД (счёт-фактура + передаточный документ)
        String docName = "Счёт-фактура и документ об отгрузке товаров (выполнении работ)"
                + (invoiceNum.isEmpty() ? "" : " № " + invoiceNum);

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<Файл ИдФайл=\"" + idFile + "\" ВерсФорм=\"5.02\" ВерсПрог=\"PRIVOD 1.0\">\n" +
                "  <СвУчДокОбор ИдОтпр=\"" + xmlEsc(sellerInn) + "\" ИдПол=\"" + xmlEsc(buyerInn.isEmpty() ? "0000000000" : buyerInn) + "\">\n" +
                "    <СвОЭДОтпр НаимОрг=\"PRIVOD Platform\" ИННЮЛ=\"" + xmlEsc(sellerInn) + "\" ИдЭДО=\"PRIVOD\"/>\n" +
                "  </СвУчДокОбор>\n" +
                "  <Документ КНД=\"1115131\" ВремИнфПр=\"" + timeStr + "\" ДатаИнфПр=\"" + todayStr + "\"\n" +
                "            НаимЭконСубСост=\"" + xmlEsc(docName) + "\" ОснДоверОргСост=\"1\">\n" +
                "    <СвСчФакт НомерСчФ=\"" + xmlEsc(invoiceNum) + "\" ДатаСчФ=\"" + dateStr + "\" КодОКВ=\"643\">\n" +
                "      <СвПрод>\n" +
                "        <ИдСубъект>\n" +
                "          <СвЮЛ НаимОрг=\"Организация\" ИННЮЛ=\"" + xmlEsc(sellerInn) + "\" КПП=\"" + xmlEsc(sellerKpp) + "\"/>\n" +
                "        </ИдСубъект>\n" +
                "      </СвПрод>\n" +
                "      <СвПокуп>\n" +
                "        <ИдСубъект>\n" +
                "          <СвЮЛ НаимОрг=\"" + xmlEsc(buyerName) + "\" ИННЮЛ=\"" + xmlEsc(buyerInn.isEmpty() ? "0000000000" : buyerInn) + "\" КПП=\"" + xmlEsc(buyerKpp) + "\"/>\n" +
                "        </ИдСубъект>\n" +
                "      </СвПокуп>\n" +
                "      <ТаблСчФакт>\n" +
                "        <СведТов НомСтр=\"1\"\n" +
                "                 НаимТов=\"" + xmlEsc(docName) + "\"\n" +
                "                 ОКЕИ_Тов=\"796\"\n" +
                "                 КолТов=\"1\"\n" +
                "                 ЦенаТов=\"" + subtotal + "\"\n" +
                "                 СтТовБезНДС=\"" + subtotal + "\"\n" +
                "                 НалСт=\"" + vatRateLabel + "\"\n" +
                "                 СтТовУчНДС=\"" + totalWithVat + "\">\n" +
                "          <Акциз><БезАкциз/></Акциз>\n" +
                "          <СумНал><СумНал>" + vatAmount + "</СумНал></СумНал>\n" +
                "        </СведТов>\n" +
                "        <ВсегоОпл СтТовБезНДСВсего=\"" + subtotal + "\" СтТовУчНДСВсего=\"" + totalWithVat + "\">\n" +
                "          <СумНалВсего><СумНал>" + vatAmount + "</СумНал></СумНалВсего>\n" +
                "        </ВсегоОпл>\n" +
                "      </ТаблСчФакт>\n" +
                "    </СвСчФакт>\n" +
                "  </Документ>\n" +
                "</Файл>";

        log.info("УПД XML сгенерирован: idFile={}, invoiceId={}, subtotal={}, vat={}",
                idFile, invoiceId, subtotal, vatAmount);
        return xml.getBytes(StandardCharsets.UTF_8);
    }

    /** Escapes the five XML special characters for use in attribute values and text content. */
    private static String xmlEsc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private EdoDocument sendDocument(UUID configId, String sourceType, UUID sourceId) {
        EdoConfig config = edoConfigRepository.findByIdAndDeletedFalse(configId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ЭДО конфигурация не найдена: " + configId));

        if (!config.getEnabled()) {
            throw new IllegalStateException("ЭДО интеграция отключена для данной конфигурации");
        }

        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Authenticate with provider (stub)
        String token = diadokClient.authenticate();
        log.debug("Получен токен ЭДО провайдера: {}", token);

        // Send document (stub — no real content yet)
        String externalId = diadokClient.sendDocument(
                config.getBoxId(),
                new byte[0],
                sourceType + "_" + sourceId + ".xml"
        );

        // Create tracking record
        EdoDocument edoDoc = EdoDocument.builder()
                .organizationId(orgId)
                .configId(configId)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .externalId(externalId)
                .status(EdoDocumentStatus.SENT)
                .sentAt(Instant.now())
                .build();

        edoDoc = edoDocumentRepository.save(edoDoc);
        log.info("ЭДО документ создан: id={}, sourceType={}, sourceId={}, externalId={}, status=SENT",
                edoDoc.getId(), sourceType, sourceId, externalId);

        return edoDoc;
    }

    private EdoDocument getEdoDocumentOrThrow(UUID id) {
        return edoDocumentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("ЭДО документ не найден: " + id));
    }

    private EdoDocumentStatus mapProviderStatus(String providerStatus) {
        if (providerStatus == null) {
            return EdoDocumentStatus.ERROR;
        }
        return switch (providerStatus.toUpperCase()) {
            case "DELIVERED" -> EdoDocumentStatus.DELIVERED;
            case "SIGNED", "SIGNED_BY_RECEIVER", "SIGNED_BY_COUNTERPARTY" -> EdoDocumentStatus.SIGNED_BY_COUNTERPARTY;
            case "REJECTED" -> EdoDocumentStatus.REJECTED;
            case "ERROR" -> EdoDocumentStatus.ERROR;
            case "SENT" -> EdoDocumentStatus.SENT;
            default -> EdoDocumentStatus.DELIVERED;
        };
    }
}
