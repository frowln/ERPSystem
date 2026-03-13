package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.hr.domain.Crew;
import com.privod.platform.modules.hr.repository.CrewRepository;
import com.privod.platform.modules.hr.web.dto.CrewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crews")
@RequiredArgsConstructor
@Tag(name = "Crew Teams", description = "Construction crew team management")
@PreAuthorize("isAuthenticated()")
public class CrewTeamsController {

    private final CrewRepository crewRepository;

    @GetMapping
    @Operation(summary = "List all crew teams for the organization")
    public ResponseEntity<ApiResponse<List<CrewResponse>>> listCrews(
            @RequestParam(required = false) String status) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<Crew> crews;
        if (status != null && !status.isBlank()) {
            try {
                Crew.CrewStatus crewStatus = Crew.CrewStatus.valueOf(status.toUpperCase());
                crews = crewRepository.findByOrganizationIdAndStatusAndDeletedFalseOrderByNameAsc(orgId, crewStatus);
            } catch (IllegalArgumentException e) {
                crews = crewRepository.findByOrganizationIdAndDeletedFalseOrderByNameAsc(orgId);
            }
        } else {
            crews = crewRepository.findByOrganizationIdAndDeletedFalseOrderByNameAsc(orgId);
        }

        List<CrewResponse> responses = crews.stream()
                .map(CrewResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(responses));
    }
}
