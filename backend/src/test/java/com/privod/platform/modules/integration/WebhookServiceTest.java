package com.privod.platform.modules.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.WebhookDelivery;
import com.privod.platform.modules.integration.domain.WebhookDeliveryStatus;
import com.privod.platform.modules.integration.domain.WebhookEndpoint;
import com.privod.platform.modules.integration.repository.WebhookDeliveryRepository;
import com.privod.platform.modules.integration.repository.WebhookEndpointRepository;
import com.privod.platform.modules.integration.service.WebhookService;
import com.privod.platform.modules.integration.web.dto.CreateWebhookEndpointRequest;
import com.privod.platform.modules.integration.web.dto.WebhookDeliveryResponse;
import com.privod.platform.modules.integration.web.dto.WebhookEndpointResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebhookServiceTest {

    @Mock
    private WebhookEndpointRepository webhookEndpointRepository;

    @Mock
    private WebhookDeliveryRepository webhookDeliveryRepository;

    @Mock
    private AuditService auditService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private WebhookService webhookService;

    private UUID webhookId;
    private UUID deliveryId;
    private WebhookEndpoint testWebhook;
    private WebhookDelivery testDelivery;

    @BeforeEach
    void setUp() {
        webhookId = UUID.randomUUID();
        deliveryId = UUID.randomUUID();

        testWebhook = WebhookEndpoint.builder()
                .code("WH-001")
                .url("https://example.com/webhook")
                .secret("test-secret")
                .events("[\"invoice.created\",\"payment.completed\"]")
                .isActive(true)
                .build();
        testWebhook.setId(webhookId);
        testWebhook.setCreatedAt(Instant.now());

        testDelivery = WebhookDelivery.builder()
                .webhookId(webhookId)
                .eventType("invoice.created")
                .payload("{\"invoiceId\":\"123\"}")
                .status(WebhookDeliveryStatus.FAILED)
                .attempt(1)
                .build();
        testDelivery.setId(deliveryId);
        testDelivery.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Регистрация вебхука")
    class RegisterTests {

        @Test
        @DisplayName("Должен зарегистрировать новый вебхук")
        void register_Success() {
            when(webhookEndpointRepository.existsByCodeAndDeletedFalse("WH-001")).thenReturn(false);
            when(webhookEndpointRepository.save(any(WebhookEndpoint.class))).thenAnswer(inv -> {
                WebhookEndpoint w = inv.getArgument(0);
                w.setId(UUID.randomUUID());
                w.setCreatedAt(Instant.now());
                return w;
            });

            CreateWebhookEndpointRequest request = new CreateWebhookEndpointRequest(
                    "WH-001", "https://example.com/webhook", "secret",
                    List.of("invoice.created", "payment.completed"), true
            );

            WebhookEndpointResponse response = webhookService.register(request);

            assertThat(response.code()).isEqualTo("WH-001");
            assertThat(response.url()).isEqualTo("https://example.com/webhook");
            assertThat(response.isActive()).isTrue();
            verify(auditService).logCreate(eq("WebhookEndpoint"), any(UUID.class));
        }

        @Test
        @DisplayName("Должен выбросить ошибку при дублировании кода")
        void register_DuplicateCode() {
            when(webhookEndpointRepository.existsByCodeAndDeletedFalse("WH-001")).thenReturn(true);

            CreateWebhookEndpointRequest request = new CreateWebhookEndpointRequest(
                    "WH-001", "https://example.com", null, null, null
            );

            assertThatThrownBy(() -> webhookService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Доставка вебхуков")
    class DeliveryTests {

        @Test
        @DisplayName("Должен повторить неудачную доставку")
        void retryDelivery_Success() {
            when(webhookDeliveryRepository.findById(deliveryId)).thenReturn(Optional.of(testDelivery));
            when(webhookDeliveryRepository.save(any(WebhookDelivery.class))).thenAnswer(inv -> inv.getArgument(0));

            WebhookDeliveryResponse response = webhookService.retryDelivery(deliveryId);

            assertThat(response.status()).isEqualTo(WebhookDeliveryStatus.DELIVERED);
            assertThat(response.attempt()).isEqualTo(2);
        }

        @Test
        @DisplayName("Должен отклонить повтор для уже доставленного")
        void retryDelivery_AlreadyDelivered() {
            testDelivery.setStatus(WebhookDeliveryStatus.DELIVERED);
            when(webhookDeliveryRepository.findById(deliveryId)).thenReturn(Optional.of(testDelivery));

            assertThatThrownBy(() -> webhookService.retryDelivery(deliveryId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("неудачных попыток");
        }
    }

    @Test
    @DisplayName("Должен обработать входящий вебхук с валидной подписью")
    void processIncoming_ValidSignature() {
        when(webhookEndpointRepository.findByCodeAndDeletedFalse("WH-001"))
                .thenReturn(Optional.of(testWebhook));
        when(webhookDeliveryRepository.save(any(WebhookDelivery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(webhookEndpointRepository.save(any(WebhookEndpoint.class))).thenReturn(testWebhook);

        boolean result = webhookService.processIncomingWebhook(
                "WH-001", "invoice.created", "{\"id\":1}", "valid-sig");

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Должен отклонить вебхук с невалидной подписью")
    void processIncoming_InvalidSignature() {
        when(webhookEndpointRepository.findByCodeAndDeletedFalse("WH-001"))
                .thenReturn(Optional.of(testWebhook));

        boolean result = webhookService.processIncomingWebhook(
                "WH-001", "invoice.created", "{\"id\":1}", null);

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Должен выбросить ошибку для несуществующего вебхука")
    void processIncoming_NotFound() {
        when(webhookEndpointRepository.findByCodeAndDeletedFalse("UNKNOWN"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> webhookService.processIncomingWebhook(
                "UNKNOWN", "event", "{}", "sig"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("Должен мягко удалить вебхук")
    void unregister_SoftDeletes() {
        when(webhookEndpointRepository.findById(webhookId)).thenReturn(Optional.of(testWebhook));
        when(webhookEndpointRepository.save(any(WebhookEndpoint.class))).thenReturn(testWebhook);

        webhookService.unregister(webhookId);

        assertThat(testWebhook.isDeleted()).isTrue();
        verify(auditService).logDelete("WebhookEndpoint", webhookId);
    }
}
