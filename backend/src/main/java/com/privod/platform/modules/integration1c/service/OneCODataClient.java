package com.privod.platform.modules.integration1c.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.privod.platform.modules.integration1c.domain.Integration1cConfig;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * P0-FIN-4: Real HTTP OData client for 1C:Enterprise 8.3+ REST API.
 * <p>
 * Connects to the standard OData v3 endpoint published by 1C web-service:
 * {@code {baseUrl}/{databaseName}/odata/standard.odata/}
 * <p>
 * Authentication: HTTP Basic (username + password stored in Integration1cConfig).
 * All requests use JSON format ({@code $format=json}).
 */
@Component
@Slf4j
public class OneCODataClient {

    private final RestTemplate restTemplate;

    public OneCODataClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // =========================================================================
    // Counterparties (Справочник_Контрагенты)
    // =========================================================================

    /**
     * Fetches all active counterparties from 1C, paginated automatically.
     */
    public List<OneCCounterparty> fetchCounterparties(Integration1cConfig config) {
        String path = "/odata/standard.odata/Справочник_Контрагенты"
                + "?$format=json"
                + "&$select=Ref_Key,Description,ИНН,КПП,ОГРН,ЮрФактАдрес,ЭтоГруппа,DeletionMark"
                + "&$filter=DeletionMark eq false and ЭтоГруппа eq false"
                + "&$top=1000";

        List<OneCCounterparty> all = new ArrayList<>();
        String nextUrl = buildBaseUrl(config) + path;

        while (nextUrl != null) {
            ResponseEntity<CounterpartyListResponse> response = exchange(
                    config, nextUrl, HttpMethod.GET, null, CounterpartyListResponse.class);

            if (response.getBody() == null) break;

            List<OneCCounterparty> batch = response.getBody().getValue();
            if (batch != null) all.addAll(batch);

            nextUrl = response.getBody().getNextLink();
        }

        log.info("1C OData: fetched {} counterparties", all.size());
        return all;
    }

    // =========================================================================
    // Invoices — outgoing (Document_СчетНаОплатуПокупателю)
    // =========================================================================

    /**
     * Fetches outgoing payment invoices (Счёт на оплату покупателю) modified after lastSync.
     */
    public List<OneCInvoice> fetchOutgoingInvoices(Integration1cConfig config, String modifiedAfter) {
        String filter = "DeletionMark eq false";
        if (modifiedAfter != null) {
            filter += " and Date gt datetime'" + modifiedAfter + "'";
        }

        String path = "/odata/standard.odata/Document_СчетНаОплатуПокупателю"
                + "?$format=json"
                + "&$select=Ref_Key,Number,Date,Posted,СуммаДокумента,Контрагент_Key,ДоговорКонтрагента_Key"
                + "&$filter=" + urlEncode(filter)
                + "&$top=500";

        List<OneCInvoice> all = new ArrayList<>();
        String nextUrl = buildBaseUrl(config) + path;

        while (nextUrl != null) {
            ResponseEntity<InvoiceListResponse> response = exchange(
                    config, nextUrl, HttpMethod.GET, null, InvoiceListResponse.class);
            if (response.getBody() == null) break;

            List<OneCInvoice> batch = response.getBody().getValue();
            if (batch != null) all.addAll(batch);
            nextUrl = response.getBody().getNextLink();
        }

        log.info("1C OData: fetched {} outgoing invoices", all.size());
        return all;
    }

    // =========================================================================
    // Payments (Document_ПоступлениеДенежныхСредств)
    // =========================================================================

    /**
     * Fetches incoming payment documents from 1C (bank receipts confirming payment).
     */
    public List<OneCPayment> fetchIncomingPayments(Integration1cConfig config, String modifiedAfter) {
        String filter = "DeletionMark eq false and Posted eq true";
        if (modifiedAfter != null) {
            filter += " and Date gt datetime'" + modifiedAfter + "'";
        }

        String path = "/odata/standard.odata/Document_ПоступлениеДенежныхСредств"
                + "?$format=json"
                + "&$select=Ref_Key,Number,Date,СуммаДокумента,Контрагент_Key,НазначениеПлатежа"
                + "&$filter=" + urlEncode(filter)
                + "&$top=500";

        List<OneCPayment> all = new ArrayList<>();
        String nextUrl = buildBaseUrl(config) + path;

        while (nextUrl != null) {
            ResponseEntity<PaymentListResponse> response = exchange(
                    config, nextUrl, HttpMethod.GET, null, PaymentListResponse.class);
            if (response.getBody() == null) break;

            List<OneCPayment> batch = response.getBody().getValue();
            if (batch != null) all.addAll(batch);
            nextUrl = response.getBody().getNextLink();
        }

        log.info("1C OData: fetched {} incoming payments", all.size());
        return all;
    }

    // =========================================================================
    // Connection test
    // =========================================================================

    /**
     * Tests connectivity by fetching the OData $metadata document.
     */
    public boolean testConnection(Integration1cConfig config) {
        try {
            String url = buildBaseUrl(config) + "/odata/standard.odata/$metadata?$format=json";
            ResponseEntity<String> resp = exchange(config, url, HttpMethod.GET, null, String.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("1C connection test failed: {}", e.getMessage());
            return false;
        }
    }

    // =========================================================================
    // HTTP helper
    // =========================================================================

    private <T> ResponseEntity<T> exchange(
            Integration1cConfig config, String url,
            HttpMethod method, Object body, Class<T> responseType) {

        HttpHeaders headers = buildHeaders(config);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Object> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(url, method, entity, responseType);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("1C OData error {}: {} — URL: {}", e.getStatusCode(), e.getResponseBodyAsString(), url);
            throw new OneCIntegrationException("1C API error " + e.getStatusCode() + ": " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("1C OData network error: {} — URL: {}", e.getMessage(), url);
            throw new OneCIntegrationException("Cannot connect to 1C: " + e.getMessage(), e);
        }
    }

    private HttpHeaders buildHeaders(Integration1cConfig config) {
        HttpHeaders headers = new HttpHeaders();
        if (config.getUsername() != null && config.getEncryptedPassword() != null) {
            String creds = config.getUsername() + ":" + config.getEncryptedPassword();
            String encoded = Base64.getEncoder().encodeToString(creds.getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + encoded);
        }
        return headers;
    }

    private String buildBaseUrl(Integration1cConfig config) {
        String base = config.getBaseUrl();
        if (base == null || base.isBlank()) throw new OneCIntegrationException("1C base URL is not configured");
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);

        String db = config.getDatabaseName();
        if (db == null || db.isBlank()) throw new OneCIntegrationException("1C database name is not configured");

        return base + "/" + db;
    }

    private static String urlEncode(String value) {
        return value.replace(" ", "%20").replace("'", "%27");
    }

    // =========================================================================
    // 1C entity DTOs
    // =========================================================================

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OneCCounterparty {
        @JsonProperty("Ref_Key")            private String refKey;
        @JsonProperty("Description")        private String name;
        @JsonProperty("ИНН")                private String inn;
        @JsonProperty("КПП")                private String kpp;
        @JsonProperty("ОГРН")               private String ogrn;
        @JsonProperty("ЮрФактАдрес")        private String legalAddress;
        @JsonProperty("DeletionMark")       private boolean deletionMark;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OneCInvoice {
        @JsonProperty("Ref_Key")                        private String refKey;
        @JsonProperty("Number")                         private String number;
        @JsonProperty("Date")                           private String date;
        @JsonProperty("Posted")                         private boolean posted;
        @JsonProperty("СуммаДокумента")                 private Double totalAmount;
        @JsonProperty("Контрагент_Key")                 private String counterpartyKey;
        @JsonProperty("ДоговорКонтрагента_Key")         private String contractKey;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OneCPayment {
        @JsonProperty("Ref_Key")            private String refKey;
        @JsonProperty("Number")             private String number;
        @JsonProperty("Date")               private String date;
        @JsonProperty("СуммаДокумента")     private Double amount;
        @JsonProperty("Контрагент_Key")     private String counterpartyKey;
        @JsonProperty("НазначениеПлатежа")  private String paymentPurpose;
    }

    // =========================================================================
    // OData collection response wrappers
    // =========================================================================

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class CounterpartyListResponse {
        @JsonProperty("value")          private List<OneCCounterparty> value;
        @JsonProperty("odata.nextLink") private String nextLink;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class InvoiceListResponse {
        @JsonProperty("value")          private List<OneCInvoice> value;
        @JsonProperty("odata.nextLink") private String nextLink;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PaymentListResponse {
        @JsonProperty("value")          private List<OneCPayment> value;
        @JsonProperty("odata.nextLink") private String nextLink;
    }

    // =========================================================================
    // Exception
    // =========================================================================

    public static class OneCIntegrationException extends RuntimeException {
        public OneCIntegrationException(String message) { super(message); }
        public OneCIntegrationException(String message, Throwable cause) { super(message, cause); }
    }
}
