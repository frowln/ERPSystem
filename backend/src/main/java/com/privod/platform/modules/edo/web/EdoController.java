package com.privod.platform.modules.edo.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.edo.domain.EdoConfig;
import com.privod.platform.modules.edo.domain.EdoDocument;
import com.privod.platform.modules.edo.service.EdoService;
import com.privod.platform.modules.edo.web.dto.EdoConfigRequest;
import com.privod.platform.modules.edo.web.dto.EdoConfigResponse;
import com.privod.platform.modules.edo.web.dto.EdoDocumentResponse;
import com.privod.platform.modules.edo.web.dto.EdoSendResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/edo")
@RequiredArgsConstructor
@Tag(name = "ЭДО", description = "Электронный документооборот (Диадок / СБИС / Контур)")
public class EdoController {

    private final EdoService edoService;

    // ========================================================================
    // Configuration
    // ========================================================================

    @GetMapping("/config")
    @Operation(summary = "Получить конфигурацию ЭДО для текущей организации")
    public ResponseEntity<ApiResponse<EdoConfigResponse>> getConfig() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        EdoConfig config = edoService.getConfig(orgId);
        return ResponseEntity.ok(ApiResponse.ok(EdoConfigResponse.fromEntity(config)));
    }

    @PostMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Сохранить / обновить конфигурацию ЭДО")
    public ResponseEntity<ApiResponse<EdoConfigResponse>> saveConfig(
            @Valid @RequestBody EdoConfigRequest request) {
        EdoConfig config = edoService.saveConfig(request);
        return ResponseEntity.ok(ApiResponse.ok(EdoConfigResponse.fromEntity(config)));
    }

    // ========================================================================
    // Send documents
    // ========================================================================

    @PostMapping("/send/ks2/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Отправить КС-2 через ЭДО")
    public ResponseEntity<ApiResponse<EdoSendResult>> sendKs2(
            @PathVariable UUID id,
            @RequestParam UUID configId) {
        EdoDocument doc = edoService.sendKs2(configId, id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(EdoSendResult.fromEntity(doc)));
    }

    @PostMapping("/send/ks3/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Отправить КС-3 через ЭДО")
    public ResponseEntity<ApiResponse<EdoSendResult>> sendKs3(
            @PathVariable UUID id,
            @RequestParam UUID configId) {
        EdoDocument doc = edoService.sendKs3(configId, id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(EdoSendResult.fromEntity(doc)));
    }

    @PostMapping("/send/invoice/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Отправить счёт через ЭДО")
    public ResponseEntity<ApiResponse<EdoSendResult>> sendInvoice(
            @PathVariable UUID id,
            @RequestParam UUID configId) {
        EdoDocument doc = edoService.sendInvoice(configId, id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(EdoSendResult.fromEntity(doc)));
    }

    // ========================================================================
    // Document history & status
    // ========================================================================

    @GetMapping("/documents/{sourceType}/{sourceId}")
    @Operation(summary = "История ЭДО документов для исходного документа")
    public ResponseEntity<ApiResponse<List<EdoDocumentResponse>>> getDocumentHistory(
            @PathVariable String sourceType,
            @PathVariable UUID sourceId) {
        List<EdoDocument> docs = edoService.getDocumentHistory(sourceType, sourceId);
        List<EdoDocumentResponse> responses = docs.stream()
                .map(EdoDocumentResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping("/check-status/{edoDocId}")
    @Operation(summary = "Проверить статус ЭДО документа у провайдера")
    public ResponseEntity<ApiResponse<EdoDocumentResponse>> checkStatus(
            @PathVariable UUID edoDocId) {
        EdoDocument doc = edoService.checkStatus(edoDocId);
        return ResponseEntity.ok(ApiResponse.ok(EdoDocumentResponse.fromEntity(doc)));
    }

    @GetMapping("/download/{edoDocId}")
    @Operation(summary = "Скачать подписанный документ из ЭДО")
    public ResponseEntity<byte[]> downloadSignedDocument(@PathVariable UUID edoDocId) {
        byte[] content = edoService.receiveSignedDocument(edoDocId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "edo-signed-" + edoDocId + ".pdf");
        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }

    @GetMapping("/upd/{invoiceId}/xml")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Сгенерировать УПД XML по счёту (Приказ ФНС № ЕД-7-26/970@, версия 5.02)")
    public ResponseEntity<byte[]> generateUpdXml(@PathVariable UUID invoiceId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        byte[] xml = edoService.generateUpdXml(invoiceId, orgId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        String filename = "UPD_" + invoiceId + ".xml";
        headers.setContentDispositionFormData("attachment", filename);
        return new ResponseEntity<>(xml, headers, HttpStatus.OK);
    }
}
