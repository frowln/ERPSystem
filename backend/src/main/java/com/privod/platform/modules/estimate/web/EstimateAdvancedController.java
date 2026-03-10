package com.privod.platform.modules.estimate.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.estimate.service.EstimateAdvancedService;
import com.privod.platform.modules.estimate.web.dto.EstimateComparisonResponse;
import com.privod.platform.modules.estimate.web.dto.ExportConfigRequest;
import com.privod.platform.modules.estimate.web.dto.ExportHistoryResponse;
import com.privod.platform.modules.estimate.web.dto.ExportValidationResponse;
import com.privod.platform.modules.estimate.web.dto.ImportHistoryResponse;
import com.privod.platform.modules.estimate.web.dto.ImportLsrRequest;
import com.privod.platform.modules.estimate.web.dto.ImportLsrResponse;
import com.privod.platform.modules.estimate.web.dto.NormativeRateSearchResponse;
import com.privod.platform.modules.estimate.web.dto.VolumeCalculateRequest;
import com.privod.platform.modules.estimate.web.dto.VolumeCalculationResponse;
import com.privod.platform.modules.estimate.web.dto.VolumeSaveRequest;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/estimates")
@RequiredArgsConstructor
@Tag(name = "Estimates - Advanced", description = "Импорт/экспорт смет, калькулятор объёмов, план-факт, нормативные расценки")
public class EstimateAdvancedController {

    private final EstimateAdvancedService advancedService;

    // === 1. Import GRAND-Smeta estimate files ===

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Импорт сметы из ГРАНД-Смета (arps/xml/gsfx)")
    public ResponseEntity<ApiResponse<ImportHistoryResponse>> importEstimate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("format") String format) {
        ImportHistoryResponse response = advancedService.importEstimate(file, format);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // === 2. Import history ===

    @GetMapping("/import/history")
    @Operation(summary = "История импорта смет")
    public ResponseEntity<ApiResponse<List<ImportHistoryResponse>>> getImportHistory() {
        List<ImportHistoryResponse> response = advancedService.getImportHistory();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === 3. Validate estimate before GGE export ===

    @GetMapping("/{id}/export/validate")
    @Operation(summary = "Валидация сметы перед экспортом в ГГЭ")
    public ResponseEntity<ApiResponse<ExportValidationResponse>> validateForExport(
            @PathVariable UUID id) {
        ExportValidationResponse response = advancedService.validateForExport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === 4. Export estimate to GGE format ===

    @PostMapping("/{id}/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Экспорт сметы в формат ГГЭ")
    public ResponseEntity<byte[]> exportEstimate(
            @PathVariable UUID id,
            @Valid @RequestBody ExportConfigRequest config) {
        byte[] exportData = advancedService.exportEstimate(id, config);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        headers.setContentDispositionFormData("attachment", "estimate-" + id + ".xml");

        return new ResponseEntity<>(exportData, headers, HttpStatus.OK);
    }

    // === 5. Export history ===

    @GetMapping("/export/history")
    @Operation(summary = "История экспорта смет")
    public ResponseEntity<ApiResponse<List<ExportHistoryResponse>>> getExportHistory() {
        List<ExportHistoryResponse> response = advancedService.getExportHistory();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === 6. Volume calculator ===

    @PostMapping("/volume/calculate")
    @Operation(summary = "Расчёт объёма работ по типу и параметрам")
    public ResponseEntity<ApiResponse<VolumeCalculationResponse>> calculateVolume(
            @Valid @RequestBody VolumeCalculateRequest request) {
        VolumeCalculationResponse response = advancedService.calculateVolume(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === 7. Save volume calculation ===

    @PostMapping("/volume/save")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Сохранить результат расчёта объёма")
    public ResponseEntity<ApiResponse<VolumeCalculationResponse>> saveCalculation(
            @Valid @RequestBody VolumeSaveRequest request) {
        VolumeCalculationResponse response = advancedService.saveCalculation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // === 8. List saved volume calculations ===

    @GetMapping("/volume/calculations")
    @Operation(summary = "Список сохранённых расчётов объёмов")
    public ResponseEntity<ApiResponse<List<VolumeCalculationResponse>>> getSavedCalculations(
            @RequestParam(required = false) UUID projectId) {
        List<VolumeCalculationResponse> response = advancedService.getSavedCalculations(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === 9. Plan vs Fact comparison ===

    @GetMapping("/{id}/comparison")
    @Operation(summary = "Сравнение план-факт по смете")
    public ResponseEntity<ApiResponse<EstimateComparisonResponse>> getComparison(
            @PathVariable UUID id) {
        EstimateComparisonResponse response = advancedService.getComparison(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === 10. Normative rate search (GESN/FER/TER) ===

    @GetMapping("/normative-rates/search")
    @Operation(summary = "Поиск расценок в нормативных базах ГЭСН/ФЕР/ТЕР")
    public ResponseEntity<ApiResponse<List<NormativeRateSearchResponse>>> searchNormativeRates(
            @RequestParam String query,
            @RequestParam(required = false) String source) {
        List<NormativeRateSearchResponse> response = advancedService.searchNormativeRates(query, source);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === 11. Import hierarchical LSR from xlsx ===

    @PostMapping("/local/import-lsr")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Импорт иерархической ЛСР из xlsx")
    public ResponseEntity<ApiResponse<ImportLsrResponse>> importLsr(
            @Valid @RequestBody ImportLsrRequest request) {
        ImportLsrResponse response = advancedService.importLsr(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
