package com.privod.platform.modules.edo.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Stub HTTP client for Diadok (Диадок) ЭДО API.
 * <p>
 * Real implementation will call Diadok REST API
 * (https://developer.kontur.ru/doc/diadoc).
 * Currently returns mock data for all operations.
 */
@Component
@Slf4j
public class DiadokClient {

    /**
     * Authenticate with Diadok API and obtain a session token.
     *
     * @return mock authentication token
     */
    public String authenticate() {
        log.info("[Diadok STUB] authenticate() — returning mock token");
        return "mock-diadok-token-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Send a document through Diadok ЭДО.
     *
     * @param boxId    sender box ID in Diadok
     * @param content  document content bytes (PDF / XML)
     * @param fileName document file name
     * @return external document ID in Diadok system
     */
    public String sendDocument(String boxId, byte[] content, String fileName) {
        log.info("[Diadok STUB] sendDocument(boxId={}, fileName={}, size={} bytes)",
                boxId, fileName, content != null ? content.length : 0);
        String externalId = "diadok-doc-" + UUID.randomUUID().toString().substring(0, 12);
        log.info("[Diadok STUB] sendDocument — assigned externalId={}", externalId);
        return externalId;
    }

    /**
     * Check the delivery / signing status of a previously sent document.
     *
     * @param externalId document ID in Diadok
     * @return status string (stub always returns "DELIVERED")
     */
    public String getDocumentStatus(String externalId) {
        log.info("[Diadok STUB] getDocumentStatus(externalId={})", externalId);
        return "DELIVERED";
    }

    /**
     * Download the signed version of a document from Diadok.
     *
     * @param externalId document ID in Diadok
     * @return signed document bytes (stub returns empty array)
     */
    public byte[] downloadSignedDocument(String externalId) {
        log.info("[Diadok STUB] downloadSignedDocument(externalId={})", externalId);
        return new byte[0];
    }
}
