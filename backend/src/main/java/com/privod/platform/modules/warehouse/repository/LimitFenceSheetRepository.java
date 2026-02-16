package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.LimitFenceSheet;
import com.privod.platform.modules.warehouse.domain.LimitFenceSheetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LimitFenceSheetRepository extends JpaRepository<LimitFenceSheet, UUID>,
        JpaSpecificationExecutor<LimitFenceSheet> {

    Optional<LimitFenceSheet> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Optional<LimitFenceSheet> findBySheetNumberAndDeletedFalse(String sheetNumber);

    Page<LimitFenceSheet> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<LimitFenceSheet> findByStatusAndDeletedFalse(LimitFenceSheetStatus status, Pageable pageable);

    List<LimitFenceSheet> findByMaterialIdAndDeletedFalse(UUID materialId);

    @Query("SELECT lfs FROM LimitFenceSheet lfs WHERE lfs.deleted = false AND " +
            "lfs.status = 'ACTIVE' AND lfs.periodStart <= :date AND lfs.periodEnd >= :date")
    List<LimitFenceSheet> findActiveByDate(@Param("date") LocalDate date);

    @Query("SELECT lfs FROM LimitFenceSheet lfs WHERE lfs.deleted = false AND " +
            "lfs.organizationId = :organizationId AND lfs.status = 'ACTIVE' " +
            "AND lfs.periodStart <= :date AND lfs.periodEnd >= :date")
    List<LimitFenceSheet> findActiveByDateAndOrganizationId(@Param("date") LocalDate date,
                                                            @Param("organizationId") UUID organizationId);

    @Query("SELECT lfs FROM LimitFenceSheet lfs WHERE lfs.deleted = false AND " +
            "lfs.projectId = :projectId AND lfs.materialId = :materialId AND lfs.status = 'ACTIVE'")
    List<LimitFenceSheet> findActiveByProjectAndMaterial(@Param("projectId") UUID projectId,
                                                          @Param("materialId") UUID materialId);

    @Query("SELECT COALESCE(SUM(lfs.limitQuantity - lfs.issuedQuantity + lfs.returnedQuantity), 0) " +
            "FROM LimitFenceSheet lfs WHERE lfs.projectId = :projectId AND lfs.materialId = :materialId " +
            "AND lfs.status = 'ACTIVE' AND lfs.deleted = false")
    BigDecimal sumRemainingLimitByProjectAndMaterial(@Param("projectId") UUID projectId,
                                                      @Param("materialId") UUID materialId);

    @Query("SELECT COALESCE(SUM(lfs.limitQuantity - lfs.issuedQuantity + lfs.returnedQuantity), 0) " +
            "FROM LimitFenceSheet lfs WHERE lfs.projectId = :projectId AND lfs.materialId = :materialId " +
            "AND lfs.organizationId = :organizationId AND lfs.status = 'ACTIVE' AND lfs.deleted = false")
    BigDecimal sumRemainingLimitByProjectAndMaterialAndOrganizationId(@Param("projectId") UUID projectId,
                                                                      @Param("materialId") UUID materialId,
                                                                      @Param("organizationId") UUID organizationId);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
