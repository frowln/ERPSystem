package com.privod.platform.modules.revenueRecognition.repository;

import com.privod.platform.modules.revenueRecognition.domain.RevenueAdjustment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface RevenueAdjustmentRepository extends JpaRepository<RevenueAdjustment, UUID> {

    Page<RevenueAdjustment> findByRecognitionPeriodIdAndDeletedFalseOrderByCreatedAtDesc(
            UUID recognitionPeriodId, Pageable pageable);

    List<RevenueAdjustment> findByRecognitionPeriodIdAndDeletedFalse(UUID recognitionPeriodId);

    @Query("SELECT COALESCE(SUM(ra.amount), 0) FROM RevenueAdjustment ra " +
            "WHERE ra.recognitionPeriodId = :periodId AND ra.deleted = false")
    BigDecimal sumAdjustmentsByPeriod(@Param("periodId") UUID periodId);

    List<RevenueAdjustment> findByRecognitionPeriodIdAndAdjustmentTypeAndDeletedFalse(
            UUID recognitionPeriodId, String adjustmentType);
}
