package com.privod.platform.modules.subscription.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

/**
 * YooKassa (ЮKassa) payment gateway integration.
 * API Docs: https://yookassa.ru/developers/api
 */
@Service
@Slf4j
public class YooKassaService {

    private static final String YOOKASSA_API_URL = "https://api.yookassa.ru/v3";

    @Value("${app.yookassa.shop-id:}")
    private String shopId;

    @Value("${app.yookassa.secret-key:}")
    private String secretKey;

    @Value("${app.yookassa.return-url:http://localhost:3000/settings/subscription}")
    private String returnUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public boolean isConfigured() {
        return shopId != null && !shopId.isBlank() && secretKey != null && !secretKey.isBlank();
    }

    /**
     * Create a payment in YooKassa.
     *
     * @return JSON with payment id and confirmation URL, or null if not configured
     */
    public PaymentResult createPayment(BigDecimal amount, String currency, String description,
                                        String idempotencyKey, String customerEmail) {
        if (!isConfigured()) {
            log.warn("YooKassa is not configured. Skipping payment creation.");
            return null;
        }

        try {
            ObjectNode amountNode = objectMapper.createObjectNode();
            amountNode.put("value", amount.toPlainString());
            amountNode.put("currency", currency);

            ObjectNode confirmationNode = objectMapper.createObjectNode();
            confirmationNode.put("type", "redirect");
            confirmationNode.put("return_url", returnUrl);

            ObjectNode receiptNode = objectMapper.createObjectNode();
            ObjectNode customerNode = objectMapper.createObjectNode();
            customerNode.put("email", customerEmail);
            receiptNode.set("customer", customerNode);

            ObjectNode itemNode = objectMapper.createObjectNode();
            itemNode.put("description", description);
            ObjectNode itemAmountNode = objectMapper.createObjectNode();
            itemAmountNode.put("value", amount.toPlainString());
            itemAmountNode.put("currency", currency);
            itemNode.set("amount", itemAmountNode);
            itemNode.put("vat_code", 1); // НДС не облагается
            itemNode.put("quantity", "1");

            receiptNode.set("items", objectMapper.createArrayNode().add(itemNode));

            ObjectNode body = objectMapper.createObjectNode();
            body.set("amount", amountNode);
            body.set("confirmation", confirmationNode);
            body.put("capture", true);
            body.put("description", description);
            body.set("receipt", receiptNode);

            ObjectNode metadata = objectMapper.createObjectNode();
            metadata.put("idempotency_key", idempotencyKey);
            body.set("metadata", metadata);

            String json = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(YOOKASSA_API_URL + "/payments"))
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth())
                    .header("Idempotence-Key", idempotencyKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode responseBody = objectMapper.readTree(response.body());
                String paymentId = responseBody.get("id").asText();
                String confirmationUrl = responseBody.path("confirmation").path("confirmation_url").asText();
                String status = responseBody.get("status").asText();

                log.info("YooKassa payment created: id={}, status={}", paymentId, status);
                return new PaymentResult(paymentId, confirmationUrl, status);
            } else {
                log.error("YooKassa payment creation failed: status={}, body={}", response.statusCode(), response.body());
                throw new RuntimeException("YooKassa payment creation failed with status " + response.statusCode());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("YooKassa API error: {}", e.getMessage(), e);
            throw new RuntimeException("YooKassa API error: " + e.getMessage(), e);
        }
    }

    /**
     * Get payment status from YooKassa.
     */
    public String getPaymentStatus(String paymentId) {
        if (!isConfigured()) return null;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(YOOKASSA_API_URL + "/payments/" + paymentId))
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth())
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode body = objectMapper.readTree(response.body());
                return body.get("status").asText();
            } else {
                log.error("YooKassa payment status request failed: status={}, body={}", response.statusCode(), response.body());
                throw new RuntimeException("YooKassa payment status request failed with status " + response.statusCode());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to get YooKassa payment status for {}: {}", paymentId, e.getMessage(), e);
            throw new RuntimeException("Failed to get YooKassa payment status: " + e.getMessage(), e);
        }
    }

    private String basicAuth() {
        String credentials = shopId + ":" + secretKey;
        return Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    public record PaymentResult(String paymentId, String confirmationUrl, String status) {}
}
