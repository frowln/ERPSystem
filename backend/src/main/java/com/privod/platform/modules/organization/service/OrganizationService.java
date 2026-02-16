package com.privod.platform.modules.organization.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.organization.domain.Organization;
import com.privod.platform.modules.organization.domain.OrganizationType;
import com.privod.platform.modules.organization.repository.OrganizationRepository;
import com.privod.platform.modules.organization.web.dto.CreateOrganizationRequest;
import com.privod.platform.modules.organization.web.dto.OrganizationResponse;
import com.privod.platform.modules.organization.web.dto.UpdateOrganizationRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<OrganizationResponse> findAll(String search, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        String normalizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Organization> page = organizationRepository.findTenantOrganizations(currentOrgId, normalizedSearch, pageable);
        return page.map(OrganizationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public OrganizationResponse findById(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        Organization org = getOrganizationOrThrow(id);
        if (!id.equals(currentOrgId) && (org.getParentId() == null || !org.getParentId().equals(currentOrgId))) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Organization not found with id: " + id);
        }
        return OrganizationResponse.fromEntity(org);
    }

    @Transactional
    public OrganizationResponse create(CreateOrganizationRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        if (request.inn() != null && organizationRepository.existsByInn(request.inn())) {
            throw new IllegalArgumentException("Organization with INN " + request.inn() + " already exists");
        }

        UUID parentId = request.parentId();
        if (parentId == null) {
            // Tenant admins can create subsidiaries under their own organization.
            parentId = currentOrgId;
        } else if (!SecurityUtils.hasRole("SYSTEM") && !parentId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create organization under another tenant");
        }

        Organization org = Organization.builder()
                .name(request.name())
                .inn(request.inn())
                .kpp(request.kpp())
                .ogrn(request.ogrn())
                .legalAddress(request.legalAddress())
                .actualAddress(request.actualAddress())
                .phone(request.phone())
                .email(request.email())
                .type(request.type() != null ? request.type() : OrganizationType.COMPANY)
                .parentId(parentId)
                .active(true)
                .build();

        org = organizationRepository.save(org);
        auditService.logCreate("Organization", org.getId());

        log.info("Organization created: {} ({})", org.getName(), org.getId());
        return OrganizationResponse.fromEntity(org);
    }

    @Transactional
    public OrganizationResponse update(UUID id, UpdateOrganizationRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        Organization org = getOrganizationOrThrow(id);

        if (!id.equals(currentOrgId) && (org.getParentId() == null || !org.getParentId().equals(currentOrgId))) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Organization not found with id: " + id);
        }

        if (request.name() != null) {
            org.setName(request.name());
        }
        if (request.inn() != null) {
            if (!request.inn().equals(org.getInn()) && organizationRepository.existsByInn(request.inn())) {
                throw new IllegalArgumentException("Organization with INN " + request.inn() + " already exists");
            }
            org.setInn(request.inn());
        }
        if (request.kpp() != null) {
            org.setKpp(request.kpp());
        }
        if (request.ogrn() != null) {
            org.setOgrn(request.ogrn());
        }
        if (request.legalAddress() != null) {
            org.setLegalAddress(request.legalAddress());
        }
        if (request.actualAddress() != null) {
            org.setActualAddress(request.actualAddress());
        }
        if (request.phone() != null) {
            org.setPhone(request.phone());
        }
        if (request.email() != null) {
            org.setEmail(request.email());
        }
        if (request.type() != null) {
            org.setType(request.type());
        }
        if (request.parentId() != null) {
            org.setParentId(request.parentId());
        }
        if (request.active() != null) {
            org.setActive(request.active());
        }

        org = organizationRepository.save(org);
        auditService.logUpdate("Organization", org.getId(), "multiple", null, null);

        log.info("Organization updated: {} ({})", org.getName(), org.getId());
        return OrganizationResponse.fromEntity(org);
    }

    @Transactional
    public void delete(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        Organization org = getOrganizationOrThrow(id);

        if (!id.equals(currentOrgId) && (org.getParentId() == null || !org.getParentId().equals(currentOrgId))) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Organization not found with id: " + id);
        }
        org.softDelete();
        organizationRepository.save(org);
        auditService.logDelete("Organization", id);
        log.info("Organization soft-deleted: {} ({})", org.getName(), id);
    }

    private Organization getOrganizationOrThrow(UUID id) {
        return organizationRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Organization not found with id: " + id));
    }
}
