package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.ProjectSection;
import com.privod.platform.modules.finance.domain.ProjectSectionCatalog;
import com.privod.platform.modules.finance.repository.ProjectSectionRepository;
import com.privod.platform.modules.finance.web.dto.CreateCustomSectionRequest;
import com.privod.platform.modules.finance.web.dto.ProjectSectionResponse;
import com.privod.platform.modules.finance.web.dto.UpdateProjectSectionsRequest;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectSectionService {

    private final ProjectSectionRepository sectionRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<ProjectSectionResponse> getSections(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, orgId);
        return sectionRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .map(ProjectSectionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public List<ProjectSectionResponse> updateSections(UUID projectId, UpdateProjectSectionsRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, orgId);

        for (UpdateProjectSectionsRequest.SectionToggle toggle : request.sections()) {
            ProjectSection section = sectionRepository.findById(toggle.id())
                    .filter(s -> !s.isDeleted())
                    .orElseThrow(() -> new EntityNotFoundException("Раздел не найден: " + toggle.id()));
            if (!section.getProjectId().equals(projectId)) {
                throw new IllegalArgumentException("Раздел не принадлежит проекту");
            }
            section.setEnabled(toggle.enabled());
            if (toggle.sequence() != null) {
                section.setSequence(toggle.sequence());
            }
            sectionRepository.save(section);
        }

        log.info("Разделы проекта обновлены: {}", projectId);
        return getSections(projectId);
    }

    @Transactional
    public ProjectSectionResponse addCustomSection(UUID projectId, CreateCustomSectionRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, orgId);

        if (sectionRepository.existsByProjectIdAndCodeAndDeletedFalse(projectId, request.code())) {
            throw new IllegalArgumentException("Раздел с кодом " + request.code() + " уже существует");
        }

        int maxSeq = sectionRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .mapToInt(ProjectSection::getSequence)
                .max()
                .orElse(0);

        ProjectSection section = ProjectSection.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .code(request.code())
                .name(request.name())
                .enabled(true)
                .custom(true)
                .sequence(maxSeq + 10)
                .build();

        section = sectionRepository.save(section);
        log.info("Кастомный раздел добавлен: {} в проект {}", request.code(), projectId);
        return ProjectSectionResponse.fromEntity(section);
    }

    @Transactional
    public void deleteCustomSection(UUID projectId, UUID sectionId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, orgId);

        ProjectSection section = sectionRepository.findById(sectionId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Раздел не найден: " + sectionId));

        if (!section.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Раздел не принадлежит проекту");
        }
        if (!section.isCustom()) {
            throw new IllegalStateException("Можно удалить только кастомные разделы");
        }

        section.softDelete();
        sectionRepository.save(section);
        log.info("Раздел удалён: {} из проекта {}", sectionId, projectId);
    }

    @Transactional
    public List<ProjectSectionResponse> seedDefaultSections(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, orgId);

        if (sectionRepository.existsByProjectIdAndDeletedFalse(projectId)) {
            throw new IllegalStateException("Разделы проекта уже инициализированы");
        }

        for (ProjectSectionCatalog cat : ProjectSectionCatalog.values()) {
            ProjectSection section = ProjectSection.builder()
                    .organizationId(orgId)
                    .projectId(projectId)
                    .code(cat.getCode())
                    .name(cat.getName())
                    .enabled(true)
                    .custom(false)
                    .sequence(cat.getSequence())
                    .build();
            sectionRepository.save(section);
        }

        log.info("Дефолтные разделы инициализированы для проекта: {}", projectId);
        return getSections(projectId);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .filter(p -> organizationId.equals(p.getOrganizationId()))
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }
}
