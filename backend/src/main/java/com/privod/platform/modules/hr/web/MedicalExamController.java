package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hr.domain.MedicalExam;
import com.privod.platform.modules.hr.domain.MedicalExamResult;
import com.privod.platform.modules.hr.domain.MedicalExamType;
import com.privod.platform.modules.hr.repository.MedicalExamRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

/**
 * REST API для учёта медицинских осмотров работников (Приказ Минздрава №29н от 28.01.2021).
 */
@RestController
@RequestMapping("/api/medical-exams")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Medical Exams", description = "Медицинские осмотры работников (Приказ №29н)")
public class MedicalExamController {

    private final MedicalExamRepository repository;

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record MedicalExamResponse(
            UUID id,
            UUID organizationId,
            UUID employeeId,
            LocalDate examDate,
            LocalDate nextExamDate,
            MedicalExamType examType,
            MedicalExamResult result,
            String doctorName,
            String clinicName,
            String notes,
            Instant createdAt,
            Instant updatedAt
    ) {
        static MedicalExamResponse fromEntity(MedicalExam e) {
            return new MedicalExamResponse(
                    e.getId(), e.getOrganizationId(), e.getEmployeeId(),
                    e.getExamDate(), e.getNextExamDate(),
                    e.getExamType(), e.getResult(),
                    e.getDoctorName(), e.getClinicName(), e.getNotes(),
                    e.getCreatedAt(), e.getUpdatedAt()
            );
        }
    }

    public record CreateMedicalExamRequest(
            @NotNull UUID employeeId,
            @NotNull LocalDate examDate,
            LocalDate nextExamDate,
            MedicalExamType examType,
            MedicalExamResult result,
            String doctorName,
            String clinicName,
            String notes
    ) {}

    public record UpdateMedicalExamRequest(
            LocalDate examDate,
            LocalDate nextExamDate,
            MedicalExamType examType,
            MedicalExamResult result,
            String doctorName,
            String clinicName,
            String notes
    ) {}

    // ── Endpoints ─────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Список медицинских осмотров (с фильтром по сотруднику)")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<PageResponse<MedicalExamResponse>>> list(
            @RequestParam(required = false) UUID employeeId,
            @PageableDefault(size = 20, sort = "examDate", direction = Sort.Direction.DESC) Pageable pageable) {

        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Page<MedicalExam> page = employeeId != null
                ? repository.findByOrganizationIdAndEmployeeIdAndDeletedFalse(organizationId, employeeId, pageable)
                : repository.findByOrganizationIdAndDeletedFalse(organizationId, pageable);

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page.map(MedicalExamResponse::fromEntity))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить медосмотр по ID")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<MedicalExamResponse>> getById(@PathVariable UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        MedicalExam exam = findOrThrow(id, organizationId);
        return ResponseEntity.ok(ApiResponse.ok(MedicalExamResponse.fromEntity(exam)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Создать запись о медосмотре")
    @Transactional
    public ResponseEntity<ApiResponse<MedicalExamResponse>> create(
            @Valid @RequestBody CreateMedicalExamRequest request) {

        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        MedicalExam exam = MedicalExam.builder()
                .organizationId(organizationId)
                .employeeId(request.employeeId())
                .examDate(request.examDate())
                .nextExamDate(request.nextExamDate())
                .examType(request.examType() != null ? request.examType() : MedicalExamType.PERIODIC)
                .result(request.result() != null ? request.result() : MedicalExamResult.ADMITTED)
                .doctorName(request.doctorName())
                .clinicName(request.clinicName())
                .notes(request.notes())
                .build();

        exam = repository.save(exam);
        log.info("Медосмотр создан: сотрудник={}, дата={}, итог={} ({})",
                exam.getEmployeeId(), exam.getExamDate(), exam.getResult(), exam.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(MedicalExamResponse.fromEntity(exam)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Обновить запись о медосмотре")
    @Transactional
    public ResponseEntity<ApiResponse<MedicalExamResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMedicalExamRequest request) {

        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        MedicalExam exam = findOrThrow(id, organizationId);

        if (request.examDate() != null) exam.setExamDate(request.examDate());
        if (request.nextExamDate() != null) exam.setNextExamDate(request.nextExamDate());
        if (request.examType() != null) exam.setExamType(request.examType());
        if (request.result() != null) exam.setResult(request.result());
        if (request.doctorName() != null) exam.setDoctorName(request.doctorName());
        if (request.clinicName() != null) exam.setClinicName(request.clinicName());
        if (request.notes() != null) exam.setNotes(request.notes());

        exam = repository.save(exam);
        log.info("Медосмотр обновлён: {} ({})", exam.getEmployeeId(), exam.getId());
        return ResponseEntity.ok(ApiResponse.ok(MedicalExamResponse.fromEntity(exam)));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private MedicalExam findOrThrow(UUID id, UUID organizationId) {
        return repository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Медосмотр не найден: " + id));
    }
}
