package com.privod.platform.modules.approval.repository;

import com.privod.platform.modules.approval.domain.ApprovalChain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalChainRepository extends JpaRepository<ApprovalChain, UUID> {

    Optional<ApprovalChain> findFirstByEntityTypeAndEntityIdAndDeletedFalseOrderByCreatedAtDesc(String entityType, UUID entityId);

    List<ApprovalChain> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<ApprovalChain> findByIdAndDeletedFalse(UUID id);
}
