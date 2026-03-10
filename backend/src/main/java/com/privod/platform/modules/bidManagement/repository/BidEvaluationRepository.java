package com.privod.platform.modules.bidManagement.repository;

import com.privod.platform.modules.bidManagement.domain.BidEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BidEvaluationRepository extends JpaRepository<BidEvaluation, UUID> {

    List<BidEvaluation> findByBidPackageIdAndDeletedFalse(UUID bidPackageId);

    List<BidEvaluation> findByInvitationIdAndDeletedFalse(UUID invitationId);
}
