package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.ApprovalInstance;
import com.privod.platform.modules.workflowEngine.domain.ApprovalInstanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalInstanceRepository extends JpaRepository<ApprovalInstance, UUID> {

    Page<ApprovalInstance> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<ApprovalInstance> findByEntityIdAndEntityTypeAndDeletedFalse(UUID entityId, String entityType);

    Optional<ApprovalInstance> findByEntityIdAndEntityTypeAndStatusAndDeletedFalse(
            UUID entityId, String entityType, ApprovalInstanceStatus status);

    List<ApprovalInstance> findByStatusAndSlaDeadlineBeforeAndDeletedFalse(
            ApprovalInstanceStatus status, Instant deadline);

    Page<ApprovalInstance> findByOrganizationIdAndStatusAndDeletedFalse(
            UUID organizationId, ApprovalInstanceStatus status, Pageable pageable);
}
