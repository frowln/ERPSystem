package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.StockBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockBatchRepository extends JpaRepository<StockBatch, UUID> {

    /**
     * Возвращает партии для заданного материала и склада, у которых ещё есть остаток,
     * сортировка по дате прихода ASC (FIFO-порядок для справки / будущего FIFO-режима).
     */
    List<StockBatch> findByOrganizationIdAndMaterialIdAndLocationIdAndRemainingQtyGreaterThanAndDeletedFalseOrderByReceiptDateAsc(
            UUID organizationId, UUID materialId, UUID locationId, BigDecimal minQty);

    /**
     * Суммарный остаток по материалу на складе (только незакрытые партии).
     */
    @Query("SELECT COALESCE(SUM(sb.remainingQty), 0) FROM StockBatch sb " +
            "WHERE sb.organizationId = :orgId " +
            "AND sb.materialId = :materialId " +
            "AND sb.locationId = :locationId " +
            "AND sb.remainingQty > 0 " +
            "AND sb.deleted = false")
    BigDecimal sumRemainingQtyByOrgAndMaterialAndLocation(
            @Param("orgId") UUID orgId,
            @Param("materialId") UUID materialId,
            @Param("locationId") UUID locationId);

    /**
     * Средневзвешенная цена по ФСБУ 5/2019:
     * SUM(remainingQty * unitCostPrice) / SUM(remainingQty)
     * Возвращает null, если нет партий с остатком.
     */
    @Query("SELECT SUM(sb.remainingQty * sb.unitCostPrice) / SUM(sb.remainingQty) FROM StockBatch sb " +
            "WHERE sb.organizationId = :orgId " +
            "AND sb.materialId = :materialId " +
            "AND sb.locationId = :locationId " +
            "AND sb.remainingQty > 0 " +
            "AND sb.deleted = false")
    BigDecimal computeWeightedAvgPrice(
            @Param("orgId") UUID orgId,
            @Param("materialId") UUID materialId,
            @Param("locationId") UUID locationId);
}
