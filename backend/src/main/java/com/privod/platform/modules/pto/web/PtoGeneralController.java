package com.privod.platform.modules.pto.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pto.domain.ActOsvidetelstvovanieStatus;
import com.privod.platform.modules.pto.service.ActOsvidetelstvovanieService;
import com.privod.platform.modules.pto.service.LabTestService;
import com.privod.platform.modules.pto.service.PtoMaterialCertificateService;
import com.privod.platform.modules.pto.service.PtoDashboardService;
import com.privod.platform.modules.pto.web.dto.ActOsvidetelstvovanieResponse;
import com.privod.platform.modules.pto.web.dto.CreateActOsvidetelstvovanieRequest;
import com.privod.platform.modules.pto.web.dto.CreateLabTestRequest;
import com.privod.platform.modules.pto.web.dto.CreateMaterialCertificateRequest;
import com.privod.platform.modules.pto.web.dto.LabTestResponse;
import com.privod.platform.modules.pto.web.dto.MaterialCertificateResponse;
import com.privod.platform.modules.pto.web.dto.PtoDashboardResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/pto")
@RequiredArgsConstructor
@Tag(name = "PTO General", description = "Акты, испытания, сертификаты и дашборд ПТО")
public class PtoGeneralController {

    private final ActOsvidetelstvovanieService actService;
    private final LabTestService labTestService;
    private final PtoMaterialCertificateService certificateService;
    private final PtoDashboardService dashboardService;

    // ======================== Dashboard ========================

    @GetMapping("/dashboard/{projectId}")
    @Operation(summary = "Дашборд ПТО по проекту")
    public ResponseEntity<ApiResponse<PtoDashboardResponse>> getDashboard(@PathVariable UUID projectId) {
        PtoDashboardResponse response = dashboardService.getDashboard(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== Acts of Osvidetelstvovanie ========================

    @GetMapping("/acts")
    @Operation(summary = "Список актов освидетельствования")
    public ResponseEntity<ApiResponse<PageResponse<ActOsvidetelstvovanieResponse>>> listActs(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ActOsvidetelstvovanieResponse> page = actService.listActs(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/acts/{id}")
    @Operation(summary = "Получить акт освидетельствования")
    public ResponseEntity<ApiResponse<ActOsvidetelstvovanieResponse>> getAct(@PathVariable UUID id) {
        ActOsvidetelstvovanieResponse response = actService.getAct(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/acts")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать акт освидетельствования")
    public ResponseEntity<ApiResponse<ActOsvidetelstvovanieResponse>> createAct(
            @Valid @RequestBody CreateActOsvidetelstvovanieRequest request) {
        ActOsvidetelstvovanieResponse response = actService.createAct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/acts/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус акта освидетельствования")
    public ResponseEntity<ApiResponse<ActOsvidetelstvovanieResponse>> changeActStatus(
            @PathVariable UUID id,
            @RequestParam ActOsvidetelstvovanieStatus status) {
        ActOsvidetelstvovanieResponse response = actService.changeStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== Lab Tests ========================

    @GetMapping("/lab-tests")
    @Operation(summary = "Список лабораторных испытаний")
    public ResponseEntity<ApiResponse<PageResponse<LabTestResponse>>> listLabTests(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<LabTestResponse> page = labTestService.listLabTests(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/lab-tests/{id}")
    @Operation(summary = "Получить лабораторное испытание")
    public ResponseEntity<ApiResponse<LabTestResponse>> getLabTest(@PathVariable UUID id) {
        LabTestResponse response = labTestService.getLabTest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/lab-tests")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать лабораторное испытание")
    public ResponseEntity<ApiResponse<LabTestResponse>> createLabTest(
            @Valid @RequestBody CreateLabTestRequest request) {
        LabTestResponse response = labTestService.createLabTest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/lab-tests/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить лабораторное испытание")
    public ResponseEntity<ApiResponse<Void>> deleteLabTest(@PathVariable UUID id) {
        labTestService.deleteLabTest(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== Material Certificates ========================

    @GetMapping("/certificates")
    @Operation(summary = "Список сертификатов материалов")
    public ResponseEntity<ApiResponse<PageResponse<MaterialCertificateResponse>>> listCertificates(
            @RequestParam UUID materialId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MaterialCertificateResponse> page = certificateService.listCertificates(materialId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/certificates/{id}")
    @Operation(summary = "Получить сертификат материала")
    public ResponseEntity<ApiResponse<MaterialCertificateResponse>> getCertificate(@PathVariable UUID id) {
        MaterialCertificateResponse response = certificateService.getCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/certificates")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать сертификат материала")
    public ResponseEntity<ApiResponse<MaterialCertificateResponse>> createCertificate(
            @Valid @RequestBody CreateMaterialCertificateRequest request) {
        MaterialCertificateResponse response = certificateService.createCertificate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/certificates/{id}/invalidate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Аннулировать сертификат")
    public ResponseEntity<ApiResponse<MaterialCertificateResponse>> invalidateCertificate(@PathVariable UUID id) {
        MaterialCertificateResponse response = certificateService.invalidateCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/certificates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить сертификат")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(@PathVariable UUID id) {
        certificateService.deleteCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
