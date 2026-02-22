package com.privod.platform.modules.commercialProposal.repository;

import com.privod.platform.modules.commercialProposal.domain.CommercialProposal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommercialProposalRepository extends JpaRepository<CommercialProposal, UUID> {

    Page<CommercialProposal> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<CommercialProposal> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    Optional<CommercialProposal> findByIdAndDeletedFalse(UUID id);

    List<CommercialProposal> findByBudgetIdAndDeletedFalse(UUID budgetId);
}
