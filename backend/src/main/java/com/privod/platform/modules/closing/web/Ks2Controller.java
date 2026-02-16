package com.privod.platform.modules.closing.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.service.ClosingDocumentService;
import com.privod.platform.modules.closing.web.dto.CreateKs2LineRequest;
import com.privod.platform.modules.closing.web.dto.CreateKs2Request;
import com.privod.platform.modules.closing.web.dto.Ks2LineResponse;
import com.privod.platform.modules.closing.web.dto.Ks2ListResponse;
import com.privod.platform.modules.closing.web.dto.Ks2Response;
import com.privod.platform.modules.closing.web.dto.UpdateKs2LineRequest;
import com.privod.platform.modules.closing.web.dto.UpdateKs2Request;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ks2")
@RequiredArgsConstructor
@Tag(name = "КС-2", description = "Акты выполненных работ (КС-2)")
public class Ks2Controller {

    private final ClosingDocumentService closingDocumentService;

    @GetMapping
    @Operation(summary = "Список документов КС-2 с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<Ks2ListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID contractId,
            @RequestParam(required = false) ClosingDocumentStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Ks2ListResponse> page = closingDocumentService.listKs2(projectId, contractId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить документ КС-2 по ID с деталями строк")
    public ResponseEntity<ApiResponse<Ks2Response>> getById(@PathVariable UUID id) {
        Ks2Response response = closingDocumentService.getKs2(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Создать новый документ КС-2")
    public ResponseEntity<ApiResponse<Ks2Response>> create(
            @Valid @RequestBody CreateKs2Request request) {
        Ks2Response response = closingDocumentService.createKs2(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Обновить документ КС-2")
    public ResponseEntity<ApiResponse<Ks2Response>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateKs2Request request) {
        Ks2Response response = closingDocumentService.updateKs2(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/lines")
    @Operation(summary = "Получить строки документа КС-2")
    public ResponseEntity<ApiResponse<List<Ks2LineResponse>>> getLines(@PathVariable UUID id) {
        List<Ks2LineResponse> lines = closingDocumentService.getKs2Lines(id);
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PostMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Добавить строку в документ КС-2")
    public ResponseEntity<ApiResponse<Ks2LineResponse>> addLine(
            @PathVariable UUID id,
            @Valid @RequestBody CreateKs2LineRequest request) {
        Ks2LineResponse response = closingDocumentService.addKs2Line(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Обновить строку документа КС-2")
    public ResponseEntity<ApiResponse<Ks2LineResponse>> updateLine(
            @PathVariable UUID lineId,
            @Valid @RequestBody UpdateKs2LineRequest request) {
        Ks2LineResponse response = closingDocumentService.updateKs2Line(lineId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Удалить строку документа КС-2")
    public ResponseEntity<ApiResponse<Void>> removeLine(@PathVariable UUID lineId) {
        closingDocumentService.removeKs2Line(lineId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Отправить КС-2 на рассмотрение")
    public ResponseEntity<ApiResponse<Ks2Response>> submit(@PathVariable UUID id) {
        Ks2Response response = closingDocumentService.submitKs2(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Подписать документ КС-2")
    public ResponseEntity<ApiResponse<Ks2Response>> sign(@PathVariable UUID id) {
        Ks2Response response = closingDocumentService.signKs2(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Закрыть документ КС-2")
    public ResponseEntity<ApiResponse<Ks2Response>> close(@PathVariable UUID id) {
        Ks2Response response = closingDocumentService.closeKs2(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
