package com.privod.platform.modules.closeout.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closeout.domain.AsBuiltLinkStatus;
import com.privod.platform.modules.closeout.service.AsBuiltTrackerService;
import com.privod.platform.modules.closeout.web.dto.AsBuiltRequirementResponse;
import com.privod.platform.modules.closeout.web.dto.AsBuiltWbsLinkResponse;
import com.privod.platform.modules.closeout.web.dto.AsBuiltWbsProgressResponse;
import com.privod.platform.modules.closeout.web.dto.CreateAsBuiltRequirementRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/closeout/as-built")
@RequiredArgsConstructor
public class AsBuiltTrackerController {

    private final AsBuiltTrackerService asBuiltTrackerService;

    // --- Requirements ---

    @GetMapping("/requirements")
    public ResponseEntity<PageResponse<AsBuiltRequirementResponse>> getRequirements(
            @RequestParam UUID projectId,
            Pageable pageable) {
        return ResponseEntity.ok(PageResponse.of(asBuiltTrackerService.getRequirements(projectId, pageable)));
    }

    @GetMapping("/requirements/defaults")
    public ResponseEntity<ApiResponse<List<AsBuiltRequirementResponse>>> getOrgDefaults() {
        return ResponseEntity.ok(ApiResponse.ok(asBuiltTrackerService.getOrgDefaults()));
    }

    @PostMapping("/requirements")
    public ResponseEntity<ApiResponse<AsBuiltRequirementResponse>> createRequirement(
            @Valid @RequestBody CreateAsBuiltRequirementRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(asBuiltTrackerService.createRequirement(request)));
    }

    @DeleteMapping("/requirements/{id}")
    public ResponseEntity<Void> deleteRequirement(@PathVariable UUID id) {
        asBuiltTrackerService.deleteRequirement(id);
        return ResponseEntity.noContent().build();
    }

    // --- WBS Links ---

    @GetMapping("/wbs/{wbsNodeId}/links")
    public ResponseEntity<ApiResponse<List<AsBuiltWbsLinkResponse>>> getLinksForWbs(
            @PathVariable UUID wbsNodeId) {
        return ResponseEntity.ok(ApiResponse.ok(asBuiltTrackerService.getLinksForWbs(wbsNodeId)));
    }

    @PostMapping("/wbs/{wbsNodeId}/link")
    public ResponseEntity<ApiResponse<AsBuiltWbsLinkResponse>> linkDocument(
            @PathVariable UUID wbsNodeId,
            @Valid @RequestBody LinkDocumentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(asBuiltTrackerService.linkDocument(
                wbsNodeId, request.projectId(), request.docCategory(), request.documentContainerId())));
    }

    @PutMapping("/links/{linkId}/status")
    public ResponseEntity<ApiResponse<AsBuiltWbsLinkResponse>> updateLinkStatus(
            @PathVariable UUID linkId,
            @Valid @RequestBody UpdateLinkStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(asBuiltTrackerService.updateLinkStatus(linkId, request.status())));
    }

    @DeleteMapping("/links/{linkId}")
    public ResponseEntity<Void> unlinkDocument(@PathVariable UUID linkId) {
        asBuiltTrackerService.unlinkDocument(linkId);
        return ResponseEntity.noContent().build();
    }

    // --- Dashboard ---

    @GetMapping("/progress/{projectId}")
    public ResponseEntity<ApiResponse<List<AsBuiltWbsProgressResponse>>> getProjectProgress(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(asBuiltTrackerService.getProjectProgress(projectId)));
    }

    @GetMapping("/quality-gate/{wbsNodeId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkQualityGate(
            @PathVariable UUID wbsNodeId) {
        boolean passed = asBuiltTrackerService.checkQualityGate(wbsNodeId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("passed", passed)));
    }

    // --- Inner request records ---

    public record LinkDocumentRequest(
            UUID projectId,
            String docCategory,
            UUID documentContainerId
    ) {}

    public record UpdateLinkStatusRequest(
            AsBuiltLinkStatus status
    ) {}
}
