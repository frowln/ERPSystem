package com.privod.platform.modules.recruitment.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.recruitment.domain.ApplicantStatus;
import com.privod.platform.modules.recruitment.domain.InterviewResult;
import com.privod.platform.modules.recruitment.domain.JobPositionStatus;
import com.privod.platform.modules.recruitment.domain.RecruitmentStage;
import com.privod.platform.modules.recruitment.service.RecruitmentService;
import com.privod.platform.modules.recruitment.web.dto.ApplicantResponse;
import com.privod.platform.modules.recruitment.web.dto.CreateApplicantRequest;
import com.privod.platform.modules.recruitment.web.dto.CreateJobPositionRequest;
import com.privod.platform.modules.recruitment.web.dto.InterviewResponse;
import com.privod.platform.modules.recruitment.web.dto.JobPositionResponse;
import com.privod.platform.modules.recruitment.web.dto.ScheduleInterviewRequest;
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
@RequestMapping("/api/v1/recruitment")
@RequiredArgsConstructor
@Tag(name = "Recruitment", description = "Recruitment management endpoints")
public class RecruitmentController {

    private final RecruitmentService recruitmentService;

    // ---- Applicants ----

    @GetMapping("/applicants")
    @Operation(summary = "List applicants with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<ApplicantResponse>>> listApplicants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ApplicantStatus status,
            @RequestParam(required = false) UUID jobPositionId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ApplicantResponse> page = recruitmentService.listApplicants(search, status, jobPositionId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/applicants/{id}")
    @Operation(summary = "Get applicant by ID")
    public ResponseEntity<ApiResponse<ApplicantResponse>> getApplicant(@PathVariable UUID id) {
        ApplicantResponse response = recruitmentService.getApplicant(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/applicants")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    @Operation(summary = "Create a new applicant")
    public ResponseEntity<ApiResponse<ApplicantResponse>> createApplicant(
            @Valid @RequestBody CreateApplicantRequest request) {
        ApplicantResponse response = recruitmentService.createApplicant(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/applicants/{id}/stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    @Operation(summary = "Move applicant to a different stage")
    public ResponseEntity<ApiResponse<ApplicantResponse>> updateApplicantStage(
            @PathVariable UUID id,
            @RequestParam UUID stageId) {
        ApplicantResponse response = recruitmentService.updateApplicantStage(id, stageId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/applicants/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    @Operation(summary = "Change applicant status")
    public ResponseEntity<ApiResponse<ApplicantResponse>> updateApplicantStatus(
            @PathVariable UUID id,
            @RequestParam ApplicantStatus status) {
        ApplicantResponse response = recruitmentService.updateApplicantStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/applicants/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete an applicant")
    public ResponseEntity<ApiResponse<Void>> deleteApplicant(@PathVariable UUID id) {
        recruitmentService.deleteApplicant(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Job Positions / Vacancies ----

    @GetMapping("/vacancies")
    @Operation(summary = "List vacancies (alias for job positions) with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<JobPositionResponse>>> listVacancies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) JobPositionStatus status,
            @RequestParam(required = false) UUID departmentId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<JobPositionResponse> page = recruitmentService.listJobPositions(search, status, departmentId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/jobs")
    @Operation(summary = "List job positions with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<JobPositionResponse>>> listJobPositions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) JobPositionStatus status,
            @RequestParam(required = false) UUID departmentId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<JobPositionResponse> page = recruitmentService.listJobPositions(search, status, departmentId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/jobs/{id}")
    @Operation(summary = "Get job position by ID")
    public ResponseEntity<ApiResponse<JobPositionResponse>> getJobPosition(@PathVariable UUID id) {
        JobPositionResponse response = recruitmentService.getJobPosition(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/jobs")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new job position")
    public ResponseEntity<ApiResponse<JobPositionResponse>> createJobPosition(
            @Valid @RequestBody CreateJobPositionRequest request) {
        JobPositionResponse response = recruitmentService.createJobPosition(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/jobs/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Change job position status")
    public ResponseEntity<ApiResponse<JobPositionResponse>> updateJobPositionStatus(
            @PathVariable UUID id,
            @RequestParam JobPositionStatus status) {
        JobPositionResponse response = recruitmentService.updateJobPositionStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/jobs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete a job position")
    public ResponseEntity<ApiResponse<Void>> deleteJobPosition(@PathVariable UUID id) {
        recruitmentService.deleteJobPosition(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Stages ----

    @GetMapping("/stages")
    @Operation(summary = "List all recruitment stages in order")
    public ResponseEntity<ApiResponse<List<RecruitmentStage>>> listStages() {
        List<RecruitmentStage> stages = recruitmentService.listStages();
        return ResponseEntity.ok(ApiResponse.ok(stages));
    }

    // ---- Interviews ----

    @GetMapping("/interviews")
    @Operation(summary = "List interviews with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<InterviewResponse>>> listInterviews(
            @RequestParam(required = false) UUID applicantId,
            @RequestParam(required = false) UUID interviewerId,
            @PageableDefault(size = 20, sort = "scheduledAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<InterviewResponse> page = recruitmentService.listInterviews(applicantId, interviewerId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/interviews/{id}")
    @Operation(summary = "Get interview by ID")
    public ResponseEntity<ApiResponse<InterviewResponse>> getInterview(@PathVariable UUID id) {
        InterviewResponse response = recruitmentService.getInterview(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/interviews")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    @Operation(summary = "Schedule a new interview")
    public ResponseEntity<ApiResponse<InterviewResponse>> scheduleInterview(
            @Valid @RequestBody ScheduleInterviewRequest request) {
        InterviewResponse response = recruitmentService.scheduleInterview(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/interviews/{id}/result")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    @Operation(summary = "Update interview result")
    public ResponseEntity<ApiResponse<InterviewResponse>> updateInterviewResult(
            @PathVariable UUID id,
            @RequestParam InterviewResult result,
            @RequestParam(required = false) String notes) {
        InterviewResponse response = recruitmentService.updateInterviewResult(id, result, notes);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/interviews/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete an interview")
    public ResponseEntity<ApiResponse<Void>> deleteInterview(@PathVariable UUID id) {
        recruitmentService.deleteInterview(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
