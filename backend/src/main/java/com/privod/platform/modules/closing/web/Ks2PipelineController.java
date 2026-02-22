package com.privod.platform.modules.closing.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.closing.service.Ks2PipelineService;
import com.privod.platform.modules.closing.web.dto.Ks2PipelineRequest;
import com.privod.platform.modules.closing.web.dto.Ks2Response;
import com.privod.platform.modules.closing.web.dto.PipelinePreviewResponse;
import com.privod.platform.modules.closing.web.dto.VolumeEntry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ks2-pipeline")
@RequiredArgsConstructor
@Tag(name = "КС-2 Pipeline", description = "Автоматическая генерация КС-2 из журнала работ")
public class Ks2PipelineController {

    private final Ks2PipelineService ks2PipelineService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Сгенерировать КС-2 из журнала работ для контракта за период")
    public ResponseEntity<ApiResponse<Ks2Response>> generate(
            @Valid @RequestBody Ks2PipelineRequest request) {

        YearMonth yearMonth = YearMonth.parse(request.yearMonth());
        Ks2Response response = ks2PipelineService.generateKs2(
                request.projectId(), request.contractId(), yearMonth);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Пакетная генерация КС-2 для всех контрактов проекта за период")
    public ResponseEntity<ApiResponse<List<Ks2Response>>> batchGenerate(
            @Valid @RequestBody Ks2PipelineRequest request) {

        YearMonth yearMonth = YearMonth.parse(request.yearMonth());
        List<Ks2Response> responses = ks2PipelineService.batchGenerateKs2(
                request.projectId(), yearMonth);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(responses));
    }

    @GetMapping("/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Предпросмотр генерации КС-2: объёмы, расценки, итоги")
    public ResponseEntity<ApiResponse<PipelinePreviewResponse>> preview(
            @RequestParam UUID projectId,
            @RequestParam UUID contractId,
            @RequestParam String yearMonth) {

        YearMonth ym = YearMonth.parse(yearMonth);
        PipelinePreviewResponse response = ks2PipelineService.getPipelinePreview(
                projectId, contractId, ym);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/volumes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Собранные объёмы работ из журнала работ за период")
    public ResponseEntity<ApiResponse<List<VolumeEntry>>> volumes(
            @RequestParam UUID projectId,
            @RequestParam String yearMonth) {

        YearMonth ym = YearMonth.parse(yearMonth);
        List<VolumeEntry> volumes = ks2PipelineService.collectVolumes(projectId, ym);

        return ResponseEntity.ok(ApiResponse.ok(volumes));
    }
}
