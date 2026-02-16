package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimClash;
import com.privod.platform.modules.bim.domain.ClashStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BimClashRepository extends JpaRepository<BimClash, UUID> {

    Page<BimClash> findByModelAIdAndDeletedFalse(UUID modelAId, Pageable pageable);

    Page<BimClash> findByDeletedFalse(Pageable pageable);

    List<BimClash> findByModelAIdAndStatusAndDeletedFalse(UUID modelAId, ClashStatus status);

    @Query("SELECT c.severity, COUNT(c) FROM BimClash c " +
            "WHERE c.deleted = false AND c.modelAId = :modelId " +
            "GROUP BY c.severity")
    List<Object[]> countBySeverity(@Param("modelId") UUID modelId);
}
