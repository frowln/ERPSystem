package com.privod.platform.modules.commercialProposal.repository;

import com.privod.platform.modules.commercialProposal.domain.CommercialProposalItem;
import com.privod.platform.modules.commercialProposal.domain.ProposalItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommercialProposalItemRepository extends JpaRepository<CommercialProposalItem, UUID> {

    List<CommercialProposalItem> findByProposalId(UUID proposalId);

    List<CommercialProposalItem> findByProposalIdAndItemType(UUID proposalId, String itemType);

    List<CommercialProposalItem> findByProposalIdAndStatus(UUID proposalId, ProposalItemStatus status);

    Optional<CommercialProposalItem> findByProposalIdAndBudgetItemId(UUID proposalId, UUID budgetItemId);
}
