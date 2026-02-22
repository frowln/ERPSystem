package com.privod.platform.modules.ai.classification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.ai.classification.domain.CrossCheckStatus;
import com.privod.platform.modules.ai.classification.domain.DocumentClassType;
import com.privod.platform.modules.ai.classification.service.DocumentClassificationService;
import com.privod.platform.modules.ai.classification.web.dto.ClassificationStatsResponse;
import com.privod.platform.modules.ai.classification.web.dto.ClassifyDocumentRequest;
import com.privod.platform.modules.ai.classification.web.dto.CrossCheckRequest;
import com.privod.platform.modules.ai.classification.web.dto.DocumentClassificationResponse;
import com.privod.platform.modules.ai.classification.web.dto.DocumentCrossCheckResponse;
import com.privod.platform.modules.ai.classification.web.dto.ExtractMetadataRequest;
import com.privod.platform.modules.ai.classification.web.dto.OcrProcessingJobResponse;
import com.privod.platform.modules.ai.classification.web.dto.OverrideClassificationRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/classification")
@RequiredArgsConstructor
@Tag(name = "AI Document Classification", description = "Классификация и обработка документов с использованием ИИ")
public class DocumentClassificationController {

    private final DocumentClassificationService classificationService;

    // ======================== Classifications ========================

    @GetMapping
    @Operation(summary = "Список классификаций документов с фильтром по типу")
    public ResponseEntity<ApiResponse<PageResponse<DocumentClassificationResponse>>> listClassifications(
            @RequestParam(required = false) DocumentClassType type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DocumentClassificationResponse> page = classificationService.listClassifications(type, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить классификацию по ID")
    public ResponseEntity<ApiResponse<DocumentClassificationResponse>> getClassification(@PathVariable UUID id) {
        DocumentClassificationResponse response = classificationService.getClassification(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-document/{documentId}")
    @Operation(summary = "Получить классификацию по ID документа")
    public ResponseEntity<ApiResponse<DocumentClassificationResponse>> getByDocument(
            @PathVariable UUID documentId) {
        DocumentClassificationResponse response = classificationService.getClassificationByDocument(documentId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/classify")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Классифицировать документ по ID")
    public ResponseEntity<ApiResponse<DocumentClassificationResponse>> classifyDocument(
            @Valid @RequestBody ClassifyDocumentRequest request) {
        DocumentClassificationResponse response = classificationService.classifyDocument(request.documentId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/extract-metadata")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Извлечь метаданные из классифицированного документа")
    public ResponseEntity<ApiResponse<DocumentClassificationResponse>> extractMetadata(
            @Valid @RequestBody ExtractMetadataRequest request) {
        DocumentClassificationResponse response = classificationService.extractMetadata(request.documentId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Подтвердить классификацию документа")
    public ResponseEntity<ApiResponse<DocumentClassificationResponse>> confirmClassification(
            @PathVariable UUID id) {
        DocumentClassificationResponse response = classificationService.confirmClassification(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/override")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Переопределить тип классификации документа")
    public ResponseEntity<ApiResponse<DocumentClassificationResponse>> overrideClassification(
            @PathVariable UUID id,
            @Valid @RequestBody OverrideClassificationRequest request) {
        DocumentClassificationResponse response = classificationService.overrideClassification(id, request.newType());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== Cross-Checks ========================

    @PostMapping("/cross-check")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Запустить перекрёстную проверку двух документов (КС-2 vs смета)")
    public ResponseEntity<ApiResponse<List<DocumentCrossCheckResponse>>> crossCheckDocuments(
            @Valid @RequestBody CrossCheckRequest request) {
        List<DocumentCrossCheckResponse> responses = classificationService
                .crossCheckDocuments(request.sourceDocumentId(), request.targetDocumentId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(responses));
    }

    @GetMapping("/cross-checks")
    @Operation(summary = "Список перекрёстных проверок с фильтром по статусу")
    public ResponseEntity<ApiResponse<PageResponse<DocumentCrossCheckResponse>>> listCrossChecks(
            @RequestParam(required = false) CrossCheckStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DocumentCrossCheckResponse> page = classificationService.listCrossChecks(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/cross-checks/by-document/{documentId}")
    @Operation(summary = "Получить все перекрёстные проверки для документа")
    public ResponseEntity<ApiResponse<List<DocumentCrossCheckResponse>>> getCrossChecksByDocument(
            @PathVariable UUID documentId) {
        List<DocumentCrossCheckResponse> responses = classificationService.getCrossChecksByDocument(documentId);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    // ======================== OCR Queue ========================

    @PostMapping("/ocr/enqueue/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить документ в очередь OCR-обработки")
    public ResponseEntity<ApiResponse<OcrProcessingJobResponse>> enqueueOcr(
            @PathVariable UUID documentId) {
        OcrProcessingJobResponse response = classificationService.enqueueOcrJob(documentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/ocr")
    @Operation(summary = "Список OCR-заданий")
    public ResponseEntity<ApiResponse<PageResponse<OcrProcessingJobResponse>>> listOcrJobs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OcrProcessingJobResponse> page = classificationService.listOcrJobs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/ocr/{jobId}")
    @Operation(summary = "Получить статус OCR-задания")
    public ResponseEntity<ApiResponse<OcrProcessingJobResponse>> getOcrJob(@PathVariable UUID jobId) {
        OcrProcessingJobResponse response = classificationService.getOcrJob(jobId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== Statistics ========================

    @GetMapping("/stats")
    @Operation(summary = "Статистика по классификации и обработке документов")
    public ResponseEntity<ApiResponse<ClassificationStatsResponse>> getStats() {
        ClassificationStatsResponse stats = classificationService.getStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
