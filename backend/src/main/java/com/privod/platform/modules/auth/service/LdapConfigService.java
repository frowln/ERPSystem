package com.privod.platform.modules.auth.service;

import com.privod.platform.modules.auth.domain.LdapConfig;
import com.privod.platform.modules.auth.repository.LdapConfigRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LdapConfigService {

    private final LdapConfigRepository ldapConfigRepository;

    @Transactional(readOnly = true)
    public List<LdapConfig> getConfigs(UUID organizationId) {
        return ldapConfigRepository.findByOrganizationIdAndDeletedFalseOrderByNameAsc(organizationId);
    }

    @Transactional(readOnly = true)
    public LdapConfig getConfig(UUID id) {
        return ldapConfigRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("LDAP config not found: " + id));
    }

    @Transactional
    public LdapConfig createConfig(UUID organizationId, LdapConfig config) {
        config.setOrganizationId(organizationId);
        LdapConfig saved = ldapConfigRepository.save(config);
        log.info("LDAP config created: id={}, name={}, org={}", saved.getId(), saved.getName(), organizationId);
        return saved;
    }

    @Transactional
    public LdapConfig updateConfig(UUID id, LdapConfig updates) {
        LdapConfig existing = getConfig(id);
        existing.setName(updates.getName());
        existing.setServerUrl(updates.getServerUrl());
        existing.setBaseDn(updates.getBaseDn());
        existing.setBindDn(updates.getBindDn());
        if (updates.getBindPassword() != null && !updates.getBindPassword().isBlank()) {
            existing.setBindPassword(updates.getBindPassword());
        }
        existing.setUserSearchBase(updates.getUserSearchBase());
        existing.setUserSearchFilter(updates.getUserSearchFilter());
        existing.setGroupSearchBase(updates.getGroupSearchBase());
        existing.setGroupSearchFilter(updates.getGroupSearchFilter());
        existing.setAttributeMapping(updates.getAttributeMapping());
        existing.setGroupRoleMapping(updates.getGroupRoleMapping());
        existing.setUseSsl(updates.isUseSsl());
        existing.setUseStarttls(updates.isUseStarttls());
        existing.setConnectionTimeoutMs(updates.getConnectionTimeoutMs());
        existing.setActive(updates.isActive());
        existing.setAutoProvisionUsers(updates.isAutoProvisionUsers());
        existing.setSyncIntervalMinutes(updates.getSyncIntervalMinutes());
        LdapConfig saved = ldapConfigRepository.save(existing);
        log.info("LDAP config updated: id={}", id);
        return saved;
    }

    @Transactional
    public void deleteConfig(UUID id) {
        LdapConfig config = getConfig(id);
        config.setDeleted(true);
        ldapConfigRepository.save(config);
        log.info("LDAP config deleted: id={}", id);
    }

    @Transactional
    public LdapConfig testConnection(UUID id) {
        LdapConfig config = getConfig(id);
        try {
            // Connection test using basic socket — actual LDAP bind requires spring-ldap dependency
            java.net.URI uri = java.net.URI.create(config.getServerUrl());
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : (config.isUseSsl() ? 636 : 389);

            try (java.net.Socket socket = new java.net.Socket()) {
                socket.connect(new java.net.InetSocketAddress(host, port), config.getConnectionTimeoutMs());
            }

            config.setLastSyncAt(Instant.now());
            config.setLastSyncStatus("SUCCESS");
            config.setLastSyncMessage("Connection test successful (TCP)");
            log.info("LDAP connection test OK: id={}, server={}", id, config.getServerUrl());
        } catch (Exception e) {
            config.setLastSyncAt(Instant.now());
            config.setLastSyncStatus("FAILED");
            config.setLastSyncMessage("Connection failed: " + e.getMessage());
            log.warn("LDAP connection test FAILED: id={}, error={}", id, e.getMessage());
        }
        return ldapConfigRepository.save(config);
    }
}
