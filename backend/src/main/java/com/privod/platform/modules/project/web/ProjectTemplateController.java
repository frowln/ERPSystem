package com.privod.platform.modules.project.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.project.domain.ProjectTemplate;
import com.privod.platform.modules.project.repository.ProjectTemplateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/project-templates")
@RequiredArgsConstructor
@Tag(name = "Project Templates", description = "Pre-built project templates")
public class ProjectTemplateController {

    private final ProjectTemplateRepository templateRepository;

    @GetMapping
    @Operation(summary = "List available project templates")
    public ResponseEntity<List<ProjectTemplate>> list(
            @RequestParam(required = false) String type) {

        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);

        List<ProjectTemplate> templates;
        if (type != null && !type.isBlank()) {
            templates = orgId != null
                    ? templateRepository.findByTypeAvailable(type, orgId)
                    : templateRepository.findByTemplateTypeAndDeletedFalse(type);
        } else {
            templates = orgId != null
                    ? templateRepository.findAvailable(orgId)
                    : templateRepository.findByDeletedFalse();
        }
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project template by ID")
    public ResponseEntity<ProjectTemplate> getById(@PathVariable UUID id) {
        ProjectTemplate template = templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Template not found: " + id));
        return ResponseEntity.ok(template);
    }
}
