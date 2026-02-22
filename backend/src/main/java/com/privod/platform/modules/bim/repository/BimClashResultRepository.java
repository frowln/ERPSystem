package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimClashResult;
import com.privod.platform.modules.bim.domain.ClashResultStatus;
import com.privod.platform.modules.bim.domain.ClashType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BimClashResultRepository extends JpaRepository<BimClashResult, UUID> {

    Page<BimClashResult> findByClashTestIdAndDeletedFalse(UUID clashTestId, Pageable pageable);

    Page<BimClashResult> findByClashTestIdAndStatusAndDeletedFalse(UUID clashTestId, ClashResultStatus status, Pageable pageable);

    Page<BimClashResult> findByClashTestIdAndClashTypeAndDeletedFalse(UUID clashTestId, ClashType clashType, Pageable pageable);

    Optional<BimClashResult> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    long countByClashTestIdAndDeletedFalse(UUID clashTestId);

    long countByClashTestIdAndStatusAndDeletedFalse(UUID clashTestId, ClashResultStatus status);

    @Query("SELECT r.status, COUNT(r) FROM BimClashResult r " +
            "WHERE r.clashTestId = :clashTestId AND r.deleted = false " +
            "GROUP BY r.status")
    List<Object[]> countByStatusGrouped(@Param("clashTestId") UUID clashTestId);

    @Query("SELECT r.clashType, COUNT(r) FROM BimClashResult r " +
            "WHERE r.clashTestId = :clashTestId AND r.deleted = false " +
            "GROUP BY r.clashType")
    List<Object[]> countByClashTypeGrouped(@Param("clashTestId") UUID clashTestId);

    List<BimClashResult> findByClashTestIdAndDeletedFalse(UUID clashTestId);
}
