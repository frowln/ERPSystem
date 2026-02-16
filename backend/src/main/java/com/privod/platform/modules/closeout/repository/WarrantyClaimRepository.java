package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.WarrantyClaim;
import com.privod.platform.modules.closeout.domain.WarrantyClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, UUID>,
        JpaSpecificationExecutor<WarrantyClaim> {

    Page<WarrantyClaim> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<WarrantyClaim> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, WarrantyClaimStatus status, Pageable pageable);

    Page<WarrantyClaim> findByHandoverPackageIdAndDeletedFalse(UUID handoverPackageId, Pageable pageable);

    Page<WarrantyClaim> findByDeletedFalse(Pageable pageable);
}
