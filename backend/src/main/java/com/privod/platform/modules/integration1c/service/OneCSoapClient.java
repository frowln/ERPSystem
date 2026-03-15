package com.privod.platform.modules.integration1c.service;

import com.privod.platform.modules.integration1c.domain.Integration1cConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * SOAP client for 1C:Enterprise 8.3 Exchange web services (BSP standard library).
 *
 * <p>Endpoint: {@code {baseUrl}/{publicationName}/ws/Exchange_3_0_2_2.1cws}
 *
 * <p>Tested against БИТ:Строительство 3.0.189.29 on 1C platform 8.3.27.1964.
 * Connection confirmed: Ping responds, GetIBParameters returns config version.
 */
@Component
@Slf4j
public class OneCSoapClient {

    private static final String SOAP_NS = "http://www.1c.ru/SSL/Exchange_3_0_2_2";
    private static final String WS_PATH = "/ws/Exchange_3_0_2_2.1cws";

    private final RestTemplate restTemplate;

    public OneCSoapClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────────────────────────────

    /** Calls Ping on 1C Exchange service — fastest way to verify connectivity. */
    public boolean ping(Integration1cConfig config) {
        try {
            String body = soapEnvelope("<Ping xmlns=\"" + SOAP_NS + "\"/>");
            String response = post(config, body);
            boolean ok = response != null && response.contains("PingResponse");
            log.info("1C SOAP Ping → {}", ok ? "OK" : "FAIL");
            return ok;
        } catch (Exception e) {
            log.warn("1C SOAP Ping failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Calls GetIBParameters to retrieve configuration info from 1C.
     *
     * @return map with keys: version, configName, nodeCode, prefixIB, syncComplete
     */
    public Map<String, String> getIBParameters(Integration1cConfig config) {
        String body = soapEnvelope(
            "<GetIBParameters xmlns=\"" + SOAP_NS + "\">" +
            "  <ExchangePlanName>ОбменДанными</ExchangePlanName>" +
            "  <NodeCode xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:nil=\"true\"/>" +
            "  <ResultMessage xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:nil=\"true\"/>" +
            "  <Zone>0</Zone>" +
            "  <AdvancedOptions xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:nil=\"true\"/>" +
            "</GetIBParameters>");

        try {
            String response = post(config, body);
            return parseIBParameters(response);
        } catch (Exception e) {
            log.warn("1C GetIBParameters failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Uploads an XML data package to 1C.
     * Used for exporting KS-2, KS-3, invoices FROM PRIVOD TO 1C.
     *
     * @param exchangePlanName  1C exchange plan name
     * @param nodeCode          registered exchange node code (PRIVOD side)
     * @param xmlData           base64-encoded XML data package
     * @return true if 1C accepted the package
     */
    public boolean uploadData(Integration1cConfig config,
                              String exchangePlanName, String nodeCode, String xmlData) {
        String body = soapEnvelope(
            "<UploadData xmlns=\"" + SOAP_NS + "\">" +
            "  <ExchangePlanName>" + escapeXml(exchangePlanName) + "</ExchangePlanName>" +
            "  <NodeCode>" + escapeXml(nodeCode) + "</NodeCode>" +
            "  <Data>" + escapeXml(xmlData) + "</Data>" +
            "  <Zone>0</Zone>" +
            "</UploadData>");

        try {
            String response = post(config, body);
            boolean ok = response != null && !response.contains("Fault");
            log.info("1C UploadData (plan={}, node={}) → {}", exchangePlanName, nodeCode, ok ? "OK" : "FAIL");
            return ok;
        } catch (Exception e) {
            log.warn("1C UploadData failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Downloads a data package from 1C.
     * Used for importing counterparties, contracts, documents TO PRIVOD FROM 1C.
     *
     * @param exchangePlanName  1C exchange plan name
     * @param nodeCode          registered exchange node code (PRIVOD side)
     * @return base64-encoded XML data package, or null if nothing to download
     */
    public String downloadData(Integration1cConfig config,
                               String exchangePlanName, String nodeCode) {
        String body = soapEnvelope(
            "<DownloadData xmlns=\"" + SOAP_NS + "\">" +
            "  <ExchangePlanName>" + escapeXml(exchangePlanName) + "</ExchangePlanName>" +
            "  <NodeCode>" + escapeXml(nodeCode) + "</NodeCode>" +
            "  <FileID></FileID>" +
            "  <ContinuousOperation xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:nil=\"true\"/>" +
            "  <Operation xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:nil=\"true\"/>" +
            "  <ContinuousOperationAllowed>false</ContinuousOperationAllowed>" +
            "  <Zone>0</Zone>" +
            "</DownloadData>");

        try {
            String response = post(config, body);
            if (response == null || response.contains("Fault")) return null;
            return extractReturnValue(response);
        } catch (Exception e) {
            log.warn("1C DownloadData failed: {}", e.getMessage());
            return null;
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // HTTP helper
    // ──────────────────────────────────────────────────────────────────────

    private String post(Integration1cConfig config, String soapBody) {
        String url = buildWsUrl(config);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_XML);
        headers.set("SOAPAction", "\"\"");
        if (config.getUsername() != null) {
            String creds = config.getUsername() + ":" + config.getEncryptedPassword();
            headers.set("Authorization", "Basic " +
                    Base64.getEncoder().encodeToString(creds.getBytes(StandardCharsets.UTF_8)));
        }

        HttpEntity<String> entity = new HttpEntity<>(soapBody, headers);
        try {
            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            return resp.getBody();
        } catch (Exception e) {
            log.error("1C SOAP POST failed — URL: {}, error: {}", url, e.getMessage());
            throw new OneCODataClient.OneCIntegrationException("SOAP call failed: " + e.getMessage(), e);
        }
    }

    private String buildWsUrl(Integration1cConfig config) {
        String base = config.getBaseUrl();
        if (base == null || base.isBlank())
            throw new OneCODataClient.OneCIntegrationException("1C base URL not configured");
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);

        String pub = config.getDatabaseName();
        if (pub == null || pub.isBlank())
            throw new OneCODataClient.OneCIntegrationException("1C publication name not configured");

        return base + "/" + pub + WS_PATH;
    }

    // ──────────────────────────────────────────────────────────────────────
    // XML helpers
    // ──────────────────────────────────────────────────────────────────────

    private static String soapEnvelope(String body) {
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
               "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
               "<soap:Body>" + body + "</soap:Body>" +
               "</soap:Envelope>";
    }

    private static String escapeXml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    .replace("\"", "&quot;").replace("'", "&apos;");
    }

    /** Parse <Property name="..."><Value>...</Value></Property> entries from GetIBParameters response. */
    private static Map<String, String> parseIBParameters(String xml) {
        Map<String, String> result = new HashMap<>();
        if (xml == null) return result;

        // Simple regex-free parsing for known properties
        extractProp(xml, "ВерсияКонфигурации",         result, "version");
        extractProp(xml, "НаименованиеИнформационнойБазы", result, "configName");
        extractProp(xml, "КодЭтогоУзла",                result, "nodeCode");
        extractProp(xml, "ПрефиксИнформационнойБазы",   result, "prefixIB");
        extractProp(xml, "ИмяПланаОбмена",              result, "exchangePlanName");
        extractPropBool(xml, "ПланОбменаСуществует",    result, "planExists");
        extractPropBool(xml, "НастройкаСинхронизацииДанныхЗавершена", result, "syncComplete");

        return result;
    }

    private static void extractProp(String xml, String propName, Map<String, String> out, String key) {
        String marker = "name=\"" + propName + "\"";
        int idx = xml.indexOf(marker);
        if (idx < 0) return;
        int valStart = xml.indexOf("<Value", idx);
        if (valStart < 0) return;
        int contentStart = xml.indexOf(">", valStart) + 1;
        int contentEnd = xml.indexOf("</Value>", contentStart);
        if (contentEnd < 0) return;
        String value = xml.substring(contentStart, contentEnd).trim();
        if (!value.isEmpty()) out.put(key, value);
    }

    private static void extractPropBool(String xml, String propName, Map<String, String> out, String key) {
        extractProp(xml, propName, out, key);
    }

    private static String extractReturnValue(String xml) {
        int start = xml.indexOf("<m:return");
        if (start < 0) return null;
        int contentStart = xml.indexOf(">", start) + 1;
        int contentEnd = xml.indexOf("</m:return>", contentStart);
        if (contentEnd < 0) return null;
        return xml.substring(contentStart, contentEnd).trim();
    }
}
