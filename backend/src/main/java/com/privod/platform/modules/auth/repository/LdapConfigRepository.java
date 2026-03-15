package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.LdapConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LdapConfigRepository extends JpaRepository<LdapConfig, UUID> {

    List<LdapConfig> findByOrganizationIdAndDeletedFalseOrderByNameAsc(UUID organizationId);

    Optional<LdapConfig> findByIdAndDeletedFalse(UUID id);

    List<LdapConfig> findByIsActiveAndDeletedFalse(boolean isActive);
}
