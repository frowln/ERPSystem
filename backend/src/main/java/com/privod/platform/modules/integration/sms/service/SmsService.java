package com.privod.platform.modules.integration.sms.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.sms.domain.SmsChannel;
import com.privod.platform.modules.integration.sms.domain.SmsConfig;
import com.privod.platform.modules.integration.sms.domain.SmsMessage;
import com.privod.platform.modules.integration.sms.domain.SmsMessageStatus;
import com.privod.platform.modules.integration.sms.repository.SmsConfigRepository;
import com.privod.platform.modules.integration.sms.repository.SmsMessageRepository;
import com.privod.platform.modules.integration.sms.web.dto.BroadcastSmsRequest;
import com.privod.platform.modules.integration.sms.web.dto.SendSmsRequest;
import com.privod.platform.modules.integration.sms.web.dto.SmsConfigResponse;
import com.privod.platform.modules.integration.sms.web.dto.SmsMessageResponse;
import com.privod.platform.modules.integration.sms.web.dto.UpdateSmsConfigRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final SmsConfigRepository configRepository;
    private final SmsMessageRepository messageRepository;
    private final AuditService auditService;
    private final RestTemplate restTemplate;

    // === Config Management ===

    @Transactional(readOnly = true)
    public SmsConfigResponse getConfig() {
        SmsConfig config = configRepository.findByEnabledTrueAndDeletedFalse()
                .orElseGet(() -> {
                    List<SmsConfig> all = configRepository.findByDeletedFalse();
                    return all.isEmpty() ? null : all.get(0);
                });

        if (config == null) {
            throw new EntityNotFoundException("Конфигурация SMS не найдена");
        }

        return SmsConfigResponse.fromEntity(config);
    }

    @Transactional
    public SmsConfigResponse updateConfig(UpdateSmsConfigRequest request) {
        SmsConfig config = configRepository.findByEnabledTrueAndDeletedFalse()
                .orElseGet(() -> {
                    List<SmsConfig> all = configRepository.findByDeletedFalse();
                    return all.isEmpty() ? null : all.get(0);
                });

        if (config == null) {
            config = SmsConfig.builder()
                    .provider(request.provider())
                    .apiUrl(request.apiUrl())
                    .apiKey(request.apiKey())
                    .senderName(request.senderName())
                    .enabled(request.enabled())
                    .whatsappEnabled(request.whatsappEnabled())
                    .build();

            config = configRepository.save(config);
            auditService.logCreate("SmsConfig", config.getId());
            log.info("Конфигурация SMS создана: {} ({})",
                    config.getProvider().getDisplayName(), config.getId());
        } else {
            config.setProvider(request.provider());
            config.setApiUrl(request.apiUrl());
            if (request.apiKey() != null && !request.apiKey().isBlank()) {
                config.setApiKey(request.apiKey());
            }
            config.setSenderName(request.senderName());
            config.setEnabled(request.enabled());
            config.setWhatsappEnabled(request.whatsappEnabled());

            config = configRepository.save(config);
            auditService.logUpdate("SmsConfig", config.getId(), "config", null, null);
            log.info("Конфигурация SMS обновлена: {} ({})",
                    config.getProvider().getDisplayName(), config.getId());
        }

        return SmsConfigResponse.fromEntity(config);
    }

    // === Send Messages ===

    @Transactional
    public SmsMessageResponse sendSms(SendSmsRequest request) {
        SmsChannel channel = request.channel() != null ? request.channel() : SmsChannel.SMS;
        log.info("Отправка {} на номер {}", channel.getDisplayName(), request.phoneNumber());

        SmsMessage message = SmsMessage.builder()
                .phoneNumber(request.phoneNumber())
                .messageText(request.messageText())
                .channel(channel)
                .status(SmsMessageStatus.PENDING)
                .userId(request.userId())
                .relatedEntityType(request.relatedEntityType())
                .relatedEntityId(request.relatedEntityId())
                .build();

        message = messageRepository.save(message);
        auditService.logCreate("SmsMessage", message.getId());

        // Attempt send via configured provider (stub implementation)
        message = attemptSend(message);
        message = messageRepository.save(message);

        log.info("Сообщение {} ({}): статус={}", channel.getDisplayName(),
                message.getId(), message.getStatus().getDisplayName());

        return SmsMessageResponse.fromEntity(message);
    }

    @Transactional
    public SmsMessageResponse sendWhatsApp(String phoneNumber, String text) {
        SendSmsRequest request = new SendSmsRequest(
                phoneNumber, text, SmsChannel.WHATSAPP, null, null, null
        );
        return sendSms(request);
    }

    @Transactional
    public SmsMessageResponse sendVerificationCode(String phoneNumber) {
        String code = String.format("%06d", new Random().nextInt(999999));
        String text = "Код подтверждения Привод: " + code + ". Не сообщайте никому.";

        SendSmsRequest request = new SendSmsRequest(
                phoneNumber, text, SmsChannel.SMS, null, "verification", null
        );

        log.info("Отправка кода подтверждения на номер {}", phoneNumber);
        return sendSms(request);
    }

    @Transactional
    public List<SmsMessageResponse> broadcast(BroadcastSmsRequest request) {
        SmsChannel channel = request.channel() != null ? request.channel() : SmsChannel.SMS;
        log.info("Массовая рассылка {} на {} номеров",
                channel.getDisplayName(), request.phoneNumbers().size());

        List<SmsMessageResponse> results = new ArrayList<>();
        for (String phoneNumber : request.phoneNumbers()) {
            SendSmsRequest singleRequest = new SendSmsRequest(
                    phoneNumber, request.messageText(), channel, null, null, null
            );
            results.add(sendSms(singleRequest));
        }

        long sentCount = results.stream()
                .filter(r -> r.status() == SmsMessageStatus.SENT)
                .count();

        log.info("Массовая рассылка завершена: {}/{} отправлено", sentCount, results.size());
        return results;
    }

    // === Message Log & Status ===

    @Transactional(readOnly = true)
    public Page<SmsMessageResponse> listMessages(Pageable pageable) {
        return messageRepository.findByDeletedFalse(pageable)
                .map(SmsMessageResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SmsMessageResponse getDeliveryStatus(UUID messageId) {
        SmsMessage message = getMessageOrThrow(messageId);

        // Stub: simulate status update check
        if (message.getStatus() == SmsMessageStatus.SENT && message.getSentAt() != null) {
            Instant twoMinutesAgo = Instant.now().minusSeconds(120);
            if (message.getSentAt().isBefore(twoMinutesAgo)) {
                message.setStatus(SmsMessageStatus.DELIVERED);
                message.setDeliveredAt(Instant.now());
                message = messageRepository.save(message);
                auditService.logStatusChange("SmsMessage", message.getId(),
                        SmsMessageStatus.SENT.name(), SmsMessageStatus.DELIVERED.name());
                log.info("Сообщение {} доставлено", messageId);
            }
        }

        return SmsMessageResponse.fromEntity(message);
    }

    // === Private Helpers ===

    private SmsMessage attemptSend(SmsMessage message) {
        SmsConfig config = configRepository.findByEnabledTrueAndDeletedFalse()
                .orElse(null);

        if (config == null || config.getApiKey() == null || config.getApiKey().isBlank()) {
            log.warn("API-ключ SMS не настроен — используется режим эмуляции");
            // Stub: simulate successful send
            message.setStatus(SmsMessageStatus.SENT);
            message.setSentAt(Instant.now());
            message.setExternalId("stub-" + UUID.randomUUID().toString().substring(0, 8));
            auditService.logStatusChange("SmsMessage", message.getId(),
                    SmsMessageStatus.PENDING.name(), SmsMessageStatus.SENT.name());
            return message;
        }

        if (message.getChannel() == SmsChannel.WHATSAPP && !config.isWhatsappEnabled()) {
            message.setStatus(SmsMessageStatus.FAILED);
            message.setErrorMessage("WhatsApp не включён в конфигурации");
            auditService.logStatusChange("SmsMessage", message.getId(),
                    SmsMessageStatus.PENDING.name(), SmsMessageStatus.FAILED.name());
            return message;
        }

        try {
            String externalId = switch (config.getProvider()) {
                case SMSC_RU -> sendViaSmscRu(config, message);
                case SMS_AERO -> sendViaSmsAero(config, message);
                case TWILIO -> sendViaTwilio(config, message);
                case WHATSAPP_BUSINESS -> sendViaWhatsApp(config, message);
            };

            message.setStatus(SmsMessageStatus.SENT);
            message.setSentAt(Instant.now());
            message.setExternalId(externalId);
            auditService.logStatusChange("SmsMessage", message.getId(),
                    SmsMessageStatus.PENDING.name(), SmsMessageStatus.SENT.name());

            log.info("Сообщение отправлено через {} на {}, externalId={}",
                    config.getProvider().getDisplayName(), message.getPhoneNumber(), externalId);

        } catch (Exception e) {
            log.error("Ошибка отправки SMS через {}: {}", config.getProvider().getDisplayName(), e.getMessage());
            message.setStatus(SmsMessageStatus.FAILED);
            message.setErrorMessage(e.getMessage());
            auditService.logStatusChange("SmsMessage", message.getId(),
                    SmsMessageStatus.PENDING.name(), SmsMessageStatus.FAILED.name());
        }

        return message;
    }

    /**
     * Отправка через SMSC.ru API.
     * Формат: https://smsc.ru/sys/send.php?login=LOGIN&psw=PASSWORD&phones=PHONE&mes=TEXT&fmt=3
     */
    private String sendViaSmscRu(SmsConfig config, SmsMessage message) {
        // apiKey format: "login:password"
        String[] credentials = config.getApiKey().split(":", 2);
        String login = credentials[0];
        String password = credentials.length > 1 ? credentials[1] : "";

        String url = UriComponentsBuilder
                .fromHttpUrl(config.getApiUrl() != null ? config.getApiUrl() : "https://smsc.ru/sys/send.php")
                .queryParam("login", login)
                .queryParam("psw", password)
                .queryParam("phones", message.getPhoneNumber())
                .queryParam("mes", message.getMessageText())
                .queryParam("fmt", 3) // JSON response
                .queryParam("charset", "utf-8")
                .queryParam("sender", config.getSenderName() != null ? config.getSenderName() : "Privod")
                .toUriString();

        String response = restTemplate.getForObject(url, String.class);
        log.debug("SMSC.ru response: {}", response);

        // SMSC returns {"id":NNN,"cnt":1} on success
        if (response != null && response.contains("\"id\"")) {
            return "smsc-" + response.replaceAll(".*\"id\":(\\d+).*", "$1");
        }
        throw new RuntimeException("SMSC.ru ответ с ошибкой: " + response);
    }

    /**
     * Отправка через SMS Aero API.
     */
    private String sendViaSmsAero(SmsConfig config, SmsMessage message) {
        String url = UriComponentsBuilder
                .fromHttpUrl(config.getApiUrl() != null ? config.getApiUrl() : "https://gate.smsaero.ru/v2/sms/send")
                .queryParam("number", message.getPhoneNumber())
                .queryParam("text", message.getMessageText())
                .queryParam("sign", config.getSenderName() != null ? config.getSenderName() : "Privod")
                .toUriString();

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setBasicAuth(config.getApiKey(), "");
        org.springframework.http.HttpEntity<Void> request = new org.springframework.http.HttpEntity<>(headers);

        org.springframework.http.ResponseEntity<String> response =
                restTemplate.exchange(url, org.springframework.http.HttpMethod.POST, request, String.class);

        log.debug("SMS Aero response: {}", response.getBody());
        return "smsaero-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Отправка через Twilio API.
     */
    private String sendViaTwilio(SmsConfig config, SmsMessage message) {
        // apiKey format: "accountSid:authToken"
        String[] credentials = config.getApiKey().split(":", 2);
        String accountSid = credentials[0];
        String authToken = credentials.length > 1 ? credentials[1] : "";

        String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setBasicAuth(accountSid, authToken);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

        String body = "To=" + URLEncoder.encode(message.getPhoneNumber(), StandardCharsets.UTF_8)
                + "&From=" + URLEncoder.encode(config.getSenderName() != null ? config.getSenderName() : "+15005550006", StandardCharsets.UTF_8)
                + "&Body=" + URLEncoder.encode(message.getMessageText(), StandardCharsets.UTF_8);

        org.springframework.http.HttpEntity<String> request = new org.springframework.http.HttpEntity<>(body, headers);
        org.springframework.http.ResponseEntity<String> response =
                restTemplate.exchange(url, org.springframework.http.HttpMethod.POST, request, String.class);

        log.debug("Twilio response: {}", response.getBody());
        return "twilio-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Отправка через WhatsApp Business API.
     */
    private String sendViaWhatsApp(SmsConfig config, SmsMessage message) {
        String url = config.getApiUrl() != null
                ? config.getApiUrl()
                : "https://graph.facebook.com/v18.0/FROM_PHONE_NUMBER_ID/messages";

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setBearerAuth(config.getApiKey());
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

        String jsonBody = String.format("""
                {
                    "messaging_product": "whatsapp",
                    "to": "%s",
                    "type": "text",
                    "text": {"body": "%s"}
                }""", message.getPhoneNumber(),
                message.getMessageText().replace("\"", "\\\""));

        org.springframework.http.HttpEntity<String> request = new org.springframework.http.HttpEntity<>(jsonBody, headers);
        org.springframework.http.ResponseEntity<String> response =
                restTemplate.exchange(url, org.springframework.http.HttpMethod.POST, request, String.class);

        log.debug("WhatsApp response: {}", response.getBody());
        return "whatsapp-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private SmsMessage getMessageOrThrow(UUID id) {
        return messageRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сообщение SMS не найдено: " + id));
    }
}
