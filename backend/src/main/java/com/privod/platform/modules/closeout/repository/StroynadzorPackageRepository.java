package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.StroynadzorPackage;
import com.privod.platform.modules.closeout.domain.StroynadzorPackageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StroynadzorPackageRepository extends JpaRepository<StroynadzorPackage, UUID> {

    Page<StroynadzorPackage> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    Page<StroynadzorPackage> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID orgId, UUID projectId, Pageable pageable);

    List<StroynadzorPackage> findByOrganizationIdAndStatusAndDeletedFalse(UUID orgId, StroynadzorPackageStatus status);
}
