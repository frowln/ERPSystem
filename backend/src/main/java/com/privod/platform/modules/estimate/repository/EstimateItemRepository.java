package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.EstimateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface EstimateItemRepository extends JpaRepository<EstimateItem, UUID> {

    List<EstimateItem> findByEstimateIdAndDeletedFalseOrderBySequenceAsc(UUID estimateId);

    long countByEstimateIdAndDeletedFalse(UUID estimateId);

    @Query("SELECT COALESCE(SUM(ei.amount), 0) FROM EstimateItem ei WHERE ei.estimateId = :estimateId AND ei.deleted = false")
    BigDecimal sumAmountByEstimateId(@Param("estimateId") UUID estimateId);

    @Query("SELECT COALESCE(SUM(ei.orderedAmount), 0) FROM EstimateItem ei WHERE ei.estimateId = :estimateId AND ei.deleted = false")
    BigDecimal sumOrderedAmountByEstimateId(@Param("estimateId") UUID estimateId);

    @Query("SELECT COALESCE(SUM(ei.invoicedAmount), 0) FROM EstimateItem ei WHERE ei.estimateId = :estimateId AND ei.deleted = false")
    BigDecimal sumInvoicedAmountByEstimateId(@Param("estimateId") UUID estimateId);

    @Query("SELECT COALESCE(SUM(ei.deliveredAmount), 0) FROM EstimateItem ei WHERE ei.estimateId = :estimateId AND ei.deleted = false")
    BigDecimal sumDeliveredAmountByEstimateId(@Param("estimateId") UUID estimateId);

    List<EstimateItem> findByEstimateIdInAndDeletedFalse(List<UUID> estimateIds);

    @Query("SELECT COUNT(ei) FROM EstimateItem ei WHERE ei.deleted = false AND LOWER(ei.name) LIKE LOWER(CONCAT('%', :name, '%')) AND ei.unitPrice > 0")
    long countByNameContainingAndUnitPricePositive(@Param("name") String name);

    @Query("SELECT AVG(ei.unitPrice) FROM EstimateItem ei WHERE ei.deleted = false AND LOWER(ei.name) LIKE LOWER(CONCAT('%', :name, '%')) AND ei.unitPrice > 0")
    BigDecimal avgUnitPriceByNameContaining(@Param("name") String name);

    @Query("SELECT MIN(ei.unitPrice) FROM EstimateItem ei WHERE ei.deleted = false AND LOWER(ei.name) LIKE LOWER(CONCAT('%', :name, '%')) AND ei.unitPrice > 0")
    BigDecimal minUnitPriceByNameContaining(@Param("name") String name);

    @Query("SELECT MAX(ei.unitPrice) FROM EstimateItem ei WHERE ei.deleted = false AND LOWER(ei.name) LIKE LOWER(CONCAT('%', :name, '%')) AND ei.unitPrice > 0")
    BigDecimal maxUnitPriceByNameContaining(@Param("name") String name);

    @Query("SELECT ei.unitPrice FROM EstimateItem ei WHERE ei.deleted = false AND LOWER(ei.name) LIKE LOWER(CONCAT('%', :name, '%')) AND ei.unitPrice > 0")
    List<BigDecimal> findAllUnitPricesByNameContaining(@Param("name") String name);

    @Query("SELECT ei FROM EstimateItem ei WHERE ei.deleted = false AND LOWER(ei.name) LIKE LOWER(CONCAT('%', :name, '%')) AND ei.unitPrice > 0")
    List<EstimateItem> findByNameContainingAndUnitPricePositive(@Param("name") String name, Pageable pageable);

    List<EstimateItem> findByEstimateIdAndDeletedFalseOrderBySequenceAsc(UUID estimateId, Pageable pageable);
}
