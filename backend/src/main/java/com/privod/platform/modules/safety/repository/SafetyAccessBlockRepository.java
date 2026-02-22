package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.AccessBlockStatus;
import com.privod.platform.modules.safety.domain.SafetyAccessBlock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SafetyAccessBlockRepository extends JpaRepository<SafetyAccessBlock, UUID> {

    Page<SafetyAccessBlock> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId,
                                                                         AccessBlockStatus status,
                                                                         Pageable pageable);

    List<SafetyAccessBlock> findByOrganizationIdAndEmployeeIdAndStatusAndDeletedFalse(UUID organizationId,
                                                                                      UUID employeeId,
                                                                                      AccessBlockStatus status);

    Optional<SafetyAccessBlock> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    @Query("SELECT COUNT(b) FROM SafetyAccessBlock b WHERE b.organizationId = :orgId " +
           "AND b.status = 'ACTIVE' AND b.deleted = false")
    long countActiveByOrganizationId(@Param("orgId") UUID organizationId);
}
