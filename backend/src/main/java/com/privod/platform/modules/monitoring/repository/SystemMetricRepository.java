package com.privod.platform.modules.monitoring.repository;

import com.privod.platform.modules.monitoring.domain.SystemMetric;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface SystemMetricRepository extends JpaRepository<SystemMetric, UUID> {

    @Query("SELECT m FROM SystemMetric m WHERE m.deleted = false AND m.metricName = :name " +
            "AND m.recordedAt BETWEEN :from AND :to ORDER BY m.recordedAt DESC")
    List<SystemMetric> findByNameAndDateRange(@Param("name") String name,
                                               @Param("from") Instant from,
                                               @Param("to") Instant to);

    @Query("SELECT m FROM SystemMetric m WHERE m.deleted = false AND m.metricName = :name " +
            "ORDER BY m.recordedAt DESC")
    List<SystemMetric> findLatestByName(@Param("name") String name, Pageable pageable);

    @Query("SELECT DISTINCT m.metricName FROM SystemMetric m WHERE m.deleted = false ORDER BY m.metricName")
    List<String> findDistinctMetricNames();

    @Query("SELECT m FROM SystemMetric m WHERE m.deleted = false AND m.id IN " +
            "(SELECT MAX(m2.id) FROM SystemMetric m2 WHERE m2.deleted = false GROUP BY m2.metricName)")
    List<SystemMetric> findLatestForAllMetrics();
}
