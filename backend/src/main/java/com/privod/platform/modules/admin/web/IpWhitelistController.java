package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.admin.domain.IpWhitelist;
import com.privod.platform.modules.admin.repository.IpWhitelistRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/ip-whitelist")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class IpWhitelistController {

    private final IpWhitelistRepository ipWhitelistRepository;

    public record CreateIpWhitelistRequest(
            @NotBlank String ipAddress,
            String description
    ) {}

    @GetMapping
    public ResponseEntity<ApiResponse<List<IpWhitelist>>> list() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(
                ipWhitelistRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IpWhitelist>> create(@Valid @RequestBody CreateIpWhitelistRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        IpWhitelist entry = IpWhitelist.builder()
                .organizationId(orgId)
                .ipAddress(request.ipAddress())
                .description(request.description())
                .createdBy(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null
                        ? org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName()
                        : null)
                .build();
        entry = ipWhitelistRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(entry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        IpWhitelist entry = ipWhitelistRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Запись не найдена: " + id));
        entry.setActive(false);
        ipWhitelistRepository.save(entry);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
