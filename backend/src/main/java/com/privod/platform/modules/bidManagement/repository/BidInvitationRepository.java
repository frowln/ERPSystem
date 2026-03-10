package com.privod.platform.modules.bidManagement.repository;

import com.privod.platform.modules.bidManagement.domain.BidInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidInvitationRepository extends JpaRepository<BidInvitation, UUID> {

    List<BidInvitation> findByBidPackageIdAndDeletedFalseOrderByCreatedAtDesc(UUID bidPackageId);

    Optional<BidInvitation> findByIdAndDeletedFalse(UUID id);

    long countByBidPackageIdAndDeletedFalse(UUID bidPackageId);
}
