package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.StockEntry;
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
public interface StockEntryRepository extends JpaRepository<StockEntry, UUID> {

    Page<StockEntry> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<StockEntry> findByDeletedFalse(Pageable pageable);

    List<StockEntry> findByLocationIdAndOrganizationIdAndDeletedFalse(UUID locationId, UUID organizationId);

    List<StockEntry> findByLocationIdAndDeletedFalse(UUID locationId);

    Page<StockEntry> findByLocationIdAndOrganizationIdAndDeletedFalse(UUID locationId, UUID organizationId, Pageable pageable);

    Page<StockEntry> findByLocationIdAndDeletedFalse(UUID locationId, Pageable pageable);

    List<StockEntry> findByMaterialIdAndOrganizationIdAndDeletedFalse(UUID materialId, UUID organizationId);

    List<StockEntry> findByMaterialIdAndDeletedFalse(UUID materialId);

    Page<StockEntry> findByMaterialIdAndOrganizationIdAndDeletedFalse(UUID materialId, UUID organizationId, Pageable pageable);

    Page<StockEntry> findByMaterialIdAndDeletedFalse(UUID materialId, Pageable pageable);

    Optional<StockEntry> findByMaterialIdAndLocationIdAndOrganizationIdAndDeletedFalse(UUID materialId,
                                                                                        UUID locationId,
                                                                                        UUID organizationId);

    Optional<StockEntry> findByMaterialIdAndLocationIdAndDeletedFalse(UUID materialId, UUID locationId);

    @Query("SELECT se FROM StockEntry se JOIN Material m ON se.materialId = m.id " +
            "WHERE se.deleted = false AND m.deleted = false AND " +
            "se.quantity < m.minStockLevel AND m.minStockLevel > 0")
    List<StockEntry> findLowStockEntries();

    @Query("SELECT se FROM StockEntry se JOIN Material m ON se.materialId = m.id " +
            "WHERE se.deleted = false AND se.organizationId = :organizationId AND " +
            "m.deleted = false AND m.organizationId = :organizationId AND " +
            "se.quantity < m.minStockLevel AND m.minStockLevel > 0")
    List<StockEntry> findLowStockEntriesByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT se FROM StockEntry se " +
            "JOIN WarehouseLocation wl ON se.locationId = wl.id " +
            "WHERE wl.projectId = :projectId AND se.deleted = false AND wl.deleted = false")
    List<StockEntry> findByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT se FROM StockEntry se " +
            "JOIN WarehouseLocation wl ON se.locationId = wl.id " +
            "WHERE wl.projectId = :projectId AND se.organizationId = :organizationId " +
            "AND wl.organizationId = :organizationId AND se.deleted = false AND wl.deleted = false")
    List<StockEntry> findByProjectIdAndOrganizationId(@Param("projectId") UUID projectId,
                                                      @Param("organizationId") UUID organizationId);

    @Query("SELECT se FROM StockEntry se " +
            "JOIN WarehouseLocation wl ON se.locationId = wl.id " +
            "WHERE wl.projectId = :projectId AND se.deleted = false AND wl.deleted = false")
    Page<StockEntry> findByProjectId(@Param("projectId") UUID projectId, Pageable pageable);

    @Query("SELECT se FROM StockEntry se " +
            "JOIN WarehouseLocation wl ON se.locationId = wl.id " +
            "WHERE wl.projectId = :projectId AND se.organizationId = :organizationId " +
            "AND wl.organizationId = :organizationId AND se.deleted = false AND wl.deleted = false")
    Page<StockEntry> findByProjectIdAndOrganizationId(@Param("projectId") UUID projectId,
                                                      @Param("organizationId") UUID organizationId,
                                                      Pageable pageable);
}
