package com.privod.platform.modules.monitoring.repository;

import com.privod.platform.modules.monitoring.domain.EventSeverity;
import com.privod.platform.modules.monitoring.domain.SystemEvent;
import com.privod.platform.modules.monitoring.domain.SystemEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface SystemEventRepository extends JpaRepository<SystemEvent, UUID>, JpaSpecificationExecutor<SystemEvent> {

    Page<SystemEvent> findByDeletedFalseOrderByOccurredAtDesc(Pageable pageable);

    Page<SystemEvent> findByEventTypeAndDeletedFalseOrderByOccurredAtDesc(
            SystemEventType eventType, Pageable pageable);

    Page<SystemEvent> findBySeverityAndDeletedFalseOrderByOccurredAtDesc(
            EventSeverity severity, Pageable pageable);

    @Query("SELECT e FROM SystemEvent e WHERE e.deleted = false AND " +
            "e.severity IN ('ERROR', 'CRITICAL') " +
            "ORDER BY e.occurredAt DESC")
    List<SystemEvent> findRecentErrors(Pageable pageable);

    @Query("SELECT e FROM SystemEvent e WHERE e.deleted = false " +
            "AND (:eventType IS NULL OR e.eventType = :eventType) " +
            "AND (:severity IS NULL OR e.severity = :severity) " +
            "AND (:source IS NULL OR e.source = :source) " +
            "AND (:from IS NULL OR e.occurredAt >= :from) " +
            "AND (:to IS NULL OR e.occurredAt <= :to) " +
            "ORDER BY e.occurredAt DESC")
    Page<SystemEvent> findByFilters(@Param("eventType") SystemEventType eventType,
                                     @Param("severity") EventSeverity severity,
                                     @Param("source") String source,
                                     @Param("from") Instant from,
                                     @Param("to") Instant to,
                                     Pageable pageable);
}
