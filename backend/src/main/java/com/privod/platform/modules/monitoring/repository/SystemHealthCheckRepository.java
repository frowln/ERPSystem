package com.privod.platform.modules.monitoring.repository;

import com.privod.platform.modules.monitoring.domain.HealthComponent;
import com.privod.platform.modules.monitoring.domain.SystemHealthCheck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemHealthCheckRepository extends JpaRepository<SystemHealthCheck, UUID> {

    @Query("SELECT hc FROM SystemHealthCheck hc WHERE hc.deleted = false AND hc.component = :component " +
            "ORDER BY hc.checkedAt DESC LIMIT 1")
    Optional<SystemHealthCheck> findLatestByComponent(@Param("component") HealthComponent component);

    @Query("SELECT hc FROM SystemHealthCheck hc WHERE hc.deleted = false AND hc.id IN " +
            "(SELECT MAX(hc2.id) FROM SystemHealthCheck hc2 WHERE hc2.deleted = false GROUP BY hc2.component)")
    List<SystemHealthCheck> findLatestForAllComponents();

    Page<SystemHealthCheck> findByComponentAndDeletedFalseOrderByCheckedAtDesc(
            HealthComponent component, Pageable pageable);

    @Query("SELECT hc FROM SystemHealthCheck hc WHERE hc.deleted = false AND hc.component = :component " +
            "AND hc.checkedAt BETWEEN :from AND :to ORDER BY hc.checkedAt DESC")
    List<SystemHealthCheck> findByComponentAndDateRange(@Param("component") HealthComponent component,
                                                         @Param("from") Instant from,
                                                         @Param("to") Instant to);
}
