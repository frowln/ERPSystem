package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.FixedAsset;
import com.privod.platform.modules.accounting.domain.FixedAssetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FixedAssetRepository extends JpaRepository<FixedAsset, UUID> {

    Optional<FixedAsset> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Optional<FixedAsset> findByOrganizationIdAndInventoryNumberAndDeletedFalse(UUID organizationId, String inventoryNumber);

    Page<FixedAsset> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<FixedAsset> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, FixedAssetStatus status, Pageable pageable);

    List<FixedAsset> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, FixedAssetStatus status);

    @Query("SELECT COALESCE(SUM(a.currentValue), 0) FROM FixedAsset a " +
            "WHERE a.organizationId = :organizationId AND a.status = :status AND a.deleted = false")
    BigDecimal sumCurrentValueByStatus(@Param("organizationId") UUID organizationId,
                                       @Param("status") FixedAssetStatus status);
}
