package com.privod.platform.modules.auth.service;

import com.privod.platform.modules.auth.domain.SamlProvider;
import com.privod.platform.modules.auth.repository.SamlProviderRepository;
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
public class SamlProviderService {

    private final SamlProviderRepository samlProviderRepository;

    @Transactional(readOnly = true)
    public List<SamlProvider> getProviders(UUID organizationId) {
        return samlProviderRepository.findByOrganizationIdAndDeletedFalseOrderByNameAsc(organizationId);
    }

    @Transactional(readOnly = true)
    public SamlProvider getProvider(UUID id) {
        return samlProviderRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("SAML provider not found: " + id));
    }

    @Transactional
    public SamlProvider createProvider(UUID organizationId, SamlProvider provider) {
        provider.setOrganizationId(organizationId);
        SamlProvider saved = samlProviderRepository.save(provider);
        log.info("SAML provider created: id={}, code={}, org={}", saved.getId(), saved.getCode(), organizationId);
        return saved;
    }

    @Transactional
    public SamlProvider updateProvider(UUID id, SamlProvider updates) {
        SamlProvider existing = getProvider(id);
        existing.setName(updates.getName());
        existing.setIdpEntityId(updates.getIdpEntityId());
        existing.setIdpSsoUrl(updates.getIdpSsoUrl());
        existing.setIdpSloUrl(updates.getIdpSloUrl());
        existing.setIdpCertificate(updates.getIdpCertificate());
        existing.setNameIdFormat(updates.getNameIdFormat());
        existing.setAttributeMapping(updates.getAttributeMapping());
        existing.setActive(updates.isActive());
        existing.setAutoProvisionUsers(updates.isAutoProvisionUsers());
        existing.setDefaultRole(updates.getDefaultRole());
        existing.setIconUrl(updates.getIconUrl());
        SamlProvider saved = samlProviderRepository.save(existing);
        log.info("SAML provider updated: id={}", id);
        return saved;
    }

    @Transactional
    public void deleteProvider(UUID id) {
        SamlProvider provider = getProvider(id);
        provider.setDeleted(true);
        samlProviderRepository.save(provider);
        log.info("SAML provider deleted: id={}", id);
    }

    @Transactional(readOnly = true)
    public List<SamlProvider> getActiveProviders() {
        return samlProviderRepository.findByIsActiveAndDeletedFalse(true);
    }
}
