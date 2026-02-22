package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.AllocationScenario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AllocationScenarioRepository extends JpaRepository<AllocationScenario, UUID> {

    Page<AllocationScenario> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);
}
