package com.privod.platform.modules.contractExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.contractExt.domain.GuaranteeType;
import com.privod.platform.modules.contractExt.service.ContractExtService;
import com.privod.platform.modules.contractExt.web.dto.ContractGuaranteeResponse;
import com.privod.platform.modules.contractExt.web.dto.ContractInsuranceResponse;
import com.privod.platform.modules.contractExt.web.dto.ContractMilestoneResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts/{contractId}")
@RequiredArgsConstructor
@Tag(name = "Contract Extensions", description = "Гарантии, вехи, страхование")
public class ContractExtController {

    private final ContractExtService contractExtService;

    // --- Guarantees ---

    @GetMapping("/guarantees")
    @Operation(summary = "List guarantees for a contract")
    public ResponseEntity<ApiResponse<PageResponse<ContractGuaranteeResponse>>> listGuarantees(
            @PathVariable UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ContractGuaranteeResponse> page = contractExtService.listGuarantees(contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/guarantees")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new guarantee")
    public ResponseEntity<ApiResponse<ContractGuaranteeResponse>> createGuarantee(
            @PathVariable UUID contractId,
            @RequestParam GuaranteeType guaranteeType,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) String issuedBy,
            @RequestParam(required = false) LocalDate issuedAt,
            @RequestParam(required = false) LocalDate expiresAt,
            @RequestParam(required = false) String documentUrl) {
        ContractGuaranteeResponse response = contractExtService.createGuarantee(
                contractId, guaranteeType, amount, currency, issuedBy, issuedAt, expiresAt, documentUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // --- Milestones ---

    @GetMapping("/milestones")
    @Operation(summary = "List milestones for a contract")
    public ResponseEntity<ApiResponse<PageResponse<ContractMilestoneResponse>>> listMilestones(
            @PathVariable UUID contractId,
            @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<ContractMilestoneResponse> page = contractExtService.listMilestones(contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/milestones")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new milestone")
    public ResponseEntity<ApiResponse<ContractMilestoneResponse>> createMilestone(
            @PathVariable UUID contractId,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam LocalDate dueDate,
            @RequestParam(required = false) String completionCriteria,
            @RequestParam(required = false) BigDecimal amount) {
        ContractMilestoneResponse response = contractExtService.createMilestone(
                contractId, name, description, dueDate, completionCriteria, amount);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/milestones/{milestoneId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Complete a milestone")
    public ResponseEntity<ApiResponse<ContractMilestoneResponse>> completeMilestone(
            @PathVariable UUID contractId,
            @PathVariable UUID milestoneId,
            @RequestParam(required = false) String evidenceUrl) {
        return ResponseEntity.ok(ApiResponse.ok(contractExtService.completeMilestone(milestoneId, evidenceUrl)));
    }

    // --- Insurance ---

    @GetMapping("/insurances")
    @Operation(summary = "List insurances for a contract")
    public ResponseEntity<ApiResponse<PageResponse<ContractInsuranceResponse>>> listInsurances(
            @PathVariable UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ContractInsuranceResponse> page = contractExtService.listInsurances(contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/insurances")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new insurance policy")
    public ResponseEntity<ApiResponse<ContractInsuranceResponse>> createInsurance(
            @PathVariable UUID contractId,
            @RequestParam String policyNumber,
            @RequestParam String insuranceType,
            @RequestParam String insurer,
            @RequestParam BigDecimal coveredAmount,
            @RequestParam(required = false) BigDecimal premiumAmount,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(required = false) String policyUrl) {
        ContractInsuranceResponse response = contractExtService.createInsurance(
                contractId, policyNumber, insuranceType, insurer,
                coveredAmount, premiumAmount, startDate, endDate, policyUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
