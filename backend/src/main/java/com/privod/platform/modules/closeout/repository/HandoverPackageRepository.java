package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.HandoverPackage;
import com.privod.platform.modules.closeout.domain.HandoverStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HandoverPackageRepository extends JpaRepository<HandoverPackage, UUID>,
        JpaSpecificationExecutor<HandoverPackage> {

    Page<HandoverPackage> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<HandoverPackage> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, HandoverStatus status, Pageable pageable);

    Page<HandoverPackage> findByDeletedFalse(Pageable pageable);
}
