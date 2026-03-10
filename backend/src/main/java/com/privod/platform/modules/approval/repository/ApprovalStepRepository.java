package com.privod.platform.modules.approval.repository;

import com.privod.platform.modules.approval.domain.ApprovalStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, UUID> {

    List<ApprovalStep> findByChainIdOrderByStepOrderAsc(UUID chainId);

    Optional<ApprovalStep> findById(UUID id);
}
