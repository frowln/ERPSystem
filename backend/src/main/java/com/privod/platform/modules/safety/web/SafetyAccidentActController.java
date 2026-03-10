package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyAccidentActService;
import com.privod.platform.modules.safety.web.dto.AccidentActResponse;
import com.privod.platform.modules.safety.web.dto.CreateAccidentActRequest;
import com.privod.platform.modules.safety.web.dto.UpdateAccidentActStatusRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/safety/accident-acts")
@RequiredArgsConstructor
@Tag(name = "Safety Accident Acts", description = "Акты о несчастном случае (форма Н-1)")
public class SafetyAccidentActController {

    private final SafetyAccidentActService accidentActService;

    @GetMapping
    @Operation(summary = "List accident acts (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<AccidentActResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "accidentDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AccidentActResponse> page = accidentActService.listActs(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get accident act details by ID")
    public ResponseEntity<ApiResponse<AccidentActResponse>> getById(@PathVariable UUID id) {
        AccidentActResponse response = accidentActService.getAct(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Create a new accident act (form N-1)")
    public ResponseEntity<ApiResponse<AccidentActResponse>> create(
            @Valid @RequestBody CreateAccidentActRequest request) {
        AccidentActResponse response = accidentActService.createAct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Update accident act status")
    public ResponseEntity<ApiResponse<AccidentActResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAccidentActStatusRequest request) {
        AccidentActResponse response = accidentActService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
