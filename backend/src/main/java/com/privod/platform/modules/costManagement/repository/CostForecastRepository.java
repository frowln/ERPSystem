package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.CostForecast;
import com.privod.platform.modules.costManagement.domain.ForecastMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CostForecastRepository extends JpaRepository<CostForecast, UUID> {

    Page<CostForecast> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<CostForecast> findByProjectIdAndDeletedFalseOrderByForecastDateDesc(UUID projectId);

    Optional<CostForecast> findFirstByProjectIdAndDeletedFalseOrderByForecastDateDesc(UUID projectId);

    @Query("SELECT cf FROM CostForecast cf WHERE cf.projectId = :projectId " +
            "AND cf.forecastDate BETWEEN :startDate AND :endDate AND cf.deleted = false " +
            "ORDER BY cf.forecastDate ASC")
    List<CostForecast> findByProjectIdAndDateRange(@Param("projectId") UUID projectId,
                                                    @Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate);

    List<CostForecast> findByProjectIdAndForecastMethodAndDeletedFalse(UUID projectId, ForecastMethod method);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
