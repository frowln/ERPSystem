package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.PpeNorm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PpeNormRepository extends JpaRepository<PpeNorm, UUID> {
    Page<PpeNorm> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);
    List<PpeNorm> findByOrganizationIdAndJobTitleIgnoreCaseAndDeletedFalse(UUID organizationId, String jobTitle);
}
