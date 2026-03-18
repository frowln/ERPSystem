package com.privod.platform.modules.admin.repository;

import com.privod.platform.modules.admin.domain.ModuleVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModuleVisibilityRepository extends JpaRepository<ModuleVisibility, UUID> {
    Optional<ModuleVisibility> findByOrganizationIdAndDeletedFalse(UUID organizationId);
}
