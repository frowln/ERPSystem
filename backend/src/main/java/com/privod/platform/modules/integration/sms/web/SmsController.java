package com.privod.platform.modules.integration.sms.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.sms.service.SmsService;
import com.privod.platform.modules.integration.sms.web.dto.BroadcastSmsRequest;
import com.privod.platform.modules.integration.sms.web.dto.SendSmsRequest;
import com.privod.platform.modules.integration.sms.web.dto.SmsConfigResponse;
import com.privod.platform.modules.integration.sms.web.dto.SmsMessageResponse;
import com.privod.platform.modules.integration.sms.web.dto.UpdateSmsConfigRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/sms")
@RequiredArgsConstructor
@Tag(name = "SMS/WhatsApp Integration", description = "Интеграция с SMS и WhatsApp")
public class SmsController {

    private final SmsService smsService;

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Получить конфигурацию SMS")
    public ResponseEntity<ApiResponse<SmsConfigResponse>> getConfig() {
        SmsConfigResponse config = smsService.getConfig();
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию SMS")
    public ResponseEntity<ApiResponse<SmsConfigResponse>> updateConfig(
            @Valid @RequestBody UpdateSmsConfigRequest request) {
        SmsConfigResponse config = smsService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Отправить SMS или WhatsApp сообщение")
    public ResponseEntity<ApiResponse<SmsMessageResponse>> sendMessage(
            @Valid @RequestBody SendSmsRequest request) {
        SmsMessageResponse response = smsService.sendSms(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Массовая рассылка SMS")
    public ResponseEntity<ApiResponse<List<SmsMessageResponse>>> broadcast(
            @Valid @RequestBody BroadcastSmsRequest request) {
        List<SmsMessageResponse> results = smsService.broadcast(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(results));
    }

    @GetMapping("/messages")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Журнал отправленных сообщений")
    public ResponseEntity<ApiResponse<Page<SmsMessageResponse>>> listMessages(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<SmsMessageResponse> messages = smsService.listMessages(pageable);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @GetMapping("/messages/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Проверить статус доставки сообщения")
    public ResponseEntity<ApiResponse<SmsMessageResponse>> getDeliveryStatus(@PathVariable UUID id) {
        SmsMessageResponse response = smsService.getDeliveryStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
