package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.DesignPackage;
import com.privod.platform.modules.bim.domain.DesignPackageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DesignPackageRepository extends JpaRepository<DesignPackage, UUID> {

    Page<DesignPackage> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<DesignPackage> findByDeletedFalse(Pageable pageable);

    List<DesignPackage> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, DesignPackageStatus status);

    @Query(value = "SELECT nextval('design_package_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    @Query("SELECT dp.status, COUNT(dp) FROM DesignPackage dp " +
            "WHERE dp.deleted = false AND (:projectId IS NULL OR dp.projectId = :projectId) " +
            "GROUP BY dp.status")
    List<Object[]> countByStatus(@Param("projectId") UUID projectId);
}
