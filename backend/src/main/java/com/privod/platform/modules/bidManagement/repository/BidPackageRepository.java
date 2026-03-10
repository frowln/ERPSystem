package com.privod.platform.modules.bidManagement.repository;

import com.privod.platform.modules.bidManagement.domain.BidPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository("bidManagementBidPackageRepository")
public interface BidPackageRepository extends JpaRepository<BidPackage, UUID> {

    List<BidPackage> findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(UUID projectId);

    List<BidPackage> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(UUID organizationId);

    Optional<BidPackage> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);
}
