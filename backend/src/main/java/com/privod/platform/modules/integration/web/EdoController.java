package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.domain.EdoProvider;
import com.privod.platform.modules.integration.service.EdoIntegrationService;
import com.privod.platform.modules.integration.web.dto.ExternalDocumentResponse;
import com.privod.platform.modules.integration.web.dto.RejectDocumentRequest;
import com.privod.platform.modules.integration.web.dto.SendEdoDocumentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController("edoIntegrationController")
@RequestMapping("/api/integrations/edo")
@RequiredArgsConstructor
@Tag(name = "EDO Integration", description = "Электронный документооборот (ЭДО)")
public class EdoController {

    private final EdoIntegrationService edoService;

    @GetMapping("/inbox")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER')")
    @Operation(summary = "Входящие документы ЭДО")
    public ResponseEntity<ApiResponse<PageResponse<ExternalDocumentResponse>>> getInbox(
            @RequestParam(required = false) EdoProvider provider,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ExternalDocumentResponse> page = edoService.getInboxDocuments(provider, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Отправить документ через ЭДО")
    public ResponseEntity<ApiResponse<ExternalDocumentResponse>> sendDocument(
            @Valid @RequestBody SendEdoDocumentRequest request) {
        ExternalDocumentResponse response = edoService.sendDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Подписать документ ЭДО")
    public ResponseEntity<ApiResponse<ExternalDocumentResponse>> signDocument(@PathVariable UUID id) {
        ExternalDocumentResponse response = edoService.signDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Отклонить документ ЭДО")
    public ResponseEntity<ApiResponse<ExternalDocumentResponse>> rejectDocument(
            @PathVariable UUID id,
            @Valid @RequestBody RejectDocumentRequest request) {
        ExternalDocumentResponse response = edoService.rejectDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER')")
    @Operation(summary = "Получить статус документа ЭДО")
    public ResponseEntity<ApiResponse<ExternalDocumentResponse>> getDocumentStatus(@PathVariable UUID id) {
        ExternalDocumentResponse response = edoService.getDocumentStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER')")
    @Operation(summary = "Скачать документ ЭДО")
    public ResponseEntity<ApiResponse<String>> downloadDocument(@PathVariable UUID id) {
        String url = edoService.downloadDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(url));
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Получить статус интеграции ЭДО")
    public ResponseEntity<ApiResponse<EdoStatusResponse>> getEdoStatus() {
        EdoStatusResponse response = edoService.getEdoStatus();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    public record EdoStatusResponse(
            boolean configured,
            boolean connected,
            String provider,
            long totalDocuments,
            long pendingDocuments,
            java.time.Instant lastReceivedAt
    ) {}
}
