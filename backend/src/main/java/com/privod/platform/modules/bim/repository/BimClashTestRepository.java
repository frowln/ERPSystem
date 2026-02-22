package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimClashTest;
import com.privod.platform.modules.bim.domain.ClashTestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BimClashTestRepository extends JpaRepository<BimClashTest, UUID> {

    Page<BimClashTest> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<BimClashTest> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    List<BimClashTest> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);

    Optional<BimClashTest> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<BimClashTest> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, ClashTestStatus status);
}
