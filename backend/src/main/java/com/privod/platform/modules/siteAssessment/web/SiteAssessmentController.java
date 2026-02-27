package com.privod.platform.modules.siteAssessment.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.siteAssessment.service.SiteAssessmentService;
import com.privod.platform.modules.siteAssessment.web.dto.CreateSiteAssessmentRequest;
import com.privod.platform.modules.siteAssessment.web.dto.SiteAssessmentResponse;
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
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/site-assessments")
@RequiredArgsConstructor
@Tag(name = "Site Assessment", description = "Обследование строительной площадки")
public class SiteAssessmentController {

    private final SiteAssessmentService service;

    @GetMapping
    @Operation(summary = "Список обследований площадок")
    public ResponseEntity<ApiResponse<PageResponse<SiteAssessmentResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<SiteAssessmentResponse> page = service.list(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить обследование по ID")
    public ResponseEntity<ApiResponse<SiteAssessmentResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать обследование площадки")
    public ResponseEntity<ApiResponse<SiteAssessmentResponse>> create(
            @Valid @RequestBody CreateSiteAssessmentRequest request) {
        SiteAssessmentResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Завершить обследование (рассчитать скоринг)")
    public ResponseEntity<ApiResponse<SiteAssessmentResponse>> complete(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.complete(id)));
    }
}
