package com.privod.platform.modules.closing.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.service.ClosingDocumentService;
import com.privod.platform.modules.closing.web.dto.CreateKs3Request;
import com.privod.platform.modules.closing.web.dto.Ks3ListResponse;
import com.privod.platform.modules.closing.web.dto.Ks3Response;
import com.privod.platform.modules.closing.web.dto.LinkKs2Request;
import com.privod.platform.modules.closing.web.dto.UpdateKs3Request;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ks3")
@RequiredArgsConstructor
@Tag(name = "КС-3", description = "Справки о стоимости выполненных работ (КС-3)")
public class Ks3Controller {

    private final ClosingDocumentService closingDocumentService;

    @GetMapping
    @Operation(summary = "Список документов КС-3 с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<Ks3ListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID contractId,
            @RequestParam(required = false) ClosingDocumentStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Ks3ListResponse> page = closingDocumentService.listKs3(projectId, contractId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить документ КС-3 по ID с привязанными КС-2")
    public ResponseEntity<ApiResponse<Ks3Response>> getById(@PathVariable UUID id) {
        Ks3Response response = closingDocumentService.getKs3(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Создать новый документ КС-3")
    public ResponseEntity<ApiResponse<Ks3Response>> create(
            @Valid @RequestBody CreateKs3Request request) {
        Ks3Response response = closingDocumentService.createKs3(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Обновить документ КС-3")
    public ResponseEntity<ApiResponse<Ks3Response>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateKs3Request request) {
        Ks3Response response = closingDocumentService.updateKs3(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/link-ks2")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Привязать документ КС-2 к КС-3")
    public ResponseEntity<ApiResponse<Ks3Response>> linkKs2(
            @PathVariable UUID id,
            @Valid @RequestBody LinkKs2Request request) {
        Ks3Response response = closingDocumentService.linkKs2ToKs3(id, request.ks2Id());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/link-ks2/{ks2Id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Отвязать документ КС-2 от КС-3")
    public ResponseEntity<ApiResponse<Ks3Response>> unlinkKs2(
            @PathVariable UUID id,
            @PathVariable UUID ks2Id) {
        Ks3Response response = closingDocumentService.unlinkKs2FromKs3(id, ks2Id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/auto-fill")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Автоматически привязать все подписанные КС-2 по проекту/договору")
    public ResponseEntity<ApiResponse<Ks3Response>> autoFill(@PathVariable UUID id) {
        Ks3Response response = closingDocumentService.autoFillKs2(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Отправить КС-3 на рассмотрение")
    public ResponseEntity<ApiResponse<Ks3Response>> submit(@PathVariable UUID id) {
        Ks3Response response = closingDocumentService.submitKs3(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Подписать документ КС-3")
    public ResponseEntity<ApiResponse<Ks3Response>> sign(@PathVariable UUID id) {
        Ks3Response response = closingDocumentService.signKs3(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Закрыть документ КС-3")
    public ResponseEntity<ApiResponse<Ks3Response>> close(@PathVariable UUID id) {
        Ks3Response response = closingDocumentService.closeKs3(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/create-invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Создать счёт на основании КС-3")
    public ResponseEntity<ApiResponse<Map<String, UUID>>> createInvoiceFromKs3(@PathVariable UUID id) {
        UUID invoiceId = closingDocumentService.createInvoiceFromKs3(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(Map.of("invoiceId", invoiceId)));
    }
}
