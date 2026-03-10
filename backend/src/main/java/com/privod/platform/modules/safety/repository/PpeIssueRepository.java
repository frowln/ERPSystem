package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.PpeIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PpeIssueRepository extends JpaRepository<PpeIssue, UUID>,
        JpaSpecificationExecutor<PpeIssue> {

    Optional<PpeIssue> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<PpeIssue> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<PpeIssue> findByOrganizationIdAndEmployeeIdAndDeletedFalse(UUID organizationId, UUID employeeId, Pageable pageable);

    Page<PpeIssue> findByOrganizationIdAndItemIdAndDeletedFalse(UUID organizationId, UUID itemId, Pageable pageable);

    Page<PpeIssue> findByOrganizationIdAndReturnedFalseAndDeletedFalse(UUID organizationId, Pageable pageable);
}
