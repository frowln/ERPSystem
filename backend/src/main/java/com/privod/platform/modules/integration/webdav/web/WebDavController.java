package com.privod.platform.modules.integration.webdav.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.webdav.service.WebDavService;
import com.privod.platform.modules.integration.webdav.web.dto.SyncResultResponse;
import com.privod.platform.modules.integration.webdav.web.dto.UpdateWebDavConfigRequest;
import com.privod.platform.modules.integration.webdav.web.dto.WebDavConfigResponse;
import com.privod.platform.modules.integration.webdav.web.dto.WebDavFileResponse;
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

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/webdav")
@RequiredArgsConstructor
@Tag(name = "WebDAV Integration", description = "Интеграция с WebDAV файловым хранилищем")
public class WebDavController {

    private final WebDavService webDavService;

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Получить конфигурацию WebDAV")
    public ResponseEntity<ApiResponse<WebDavConfigResponse>> getConfig() {
        WebDavConfigResponse config = webDavService.getConfig();
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию WebDAV")
    public ResponseEntity<ApiResponse<WebDavConfigResponse>> updateConfig(
            @Valid @RequestBody UpdateWebDavConfigRequest request) {
        WebDavConfigResponse config = webDavService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @PostMapping("/sync/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Синхронизировать конкретный документ")
    public ResponseEntity<ApiResponse<WebDavFileResponse>> syncDocument(@PathVariable UUID documentId) {
        WebDavFileResponse result = webDavService.syncDocument(documentId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/sync-all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Синхронизировать все документы")
    public ResponseEntity<ApiResponse<SyncResultResponse>> syncAll() {
        SyncResultResponse result = webDavService.syncAllDocuments();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @GetMapping("/files")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список синхронизированных файлов")
    public ResponseEntity<ApiResponse<Page<WebDavFileResponse>>> listFiles(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<WebDavFileResponse> files = webDavService.listSyncedFiles(pageable);
        return ResponseEntity.ok(ApiResponse.ok(files));
    }

    @GetMapping("/files/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Статус синхронизации файла")
    public ResponseEntity<ApiResponse<WebDavFileResponse>> getFileStatus(@PathVariable UUID id) {
        WebDavFileResponse file = webDavService.getFileStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(file));
    }

    @PostMapping("/test-connection")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Тестировать подключение к WebDAV серверу")
    public ResponseEntity<ApiResponse<ConnectionTestResult>> testConnection() {
        Instant startedAt = Instant.now();
        boolean success;
        String message;

        try {
            success = webDavService.testConnection();
            message = success ? "Подключение к WebDAV успешно" : "Не удалось подключиться к WebDAV";
        } catch (Exception e) {
            success = false;
            message = "Ошибка подключения: " + e.getMessage();
        }

        long responseTimeMs = Instant.now().toEpochMilli() - startedAt.toEpochMilli();

        ConnectionTestResult result = new ConnectionTestResult(success, message, responseTimeMs, Instant.now());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    public record ConnectionTestResult(
            boolean success,
            String message,
            long responseTimeMs,
            Instant testedAt
    ) {
    }
}
