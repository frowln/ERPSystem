package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyTraining;
import com.privod.platform.modules.safety.domain.TrainingStatus;
import com.privod.platform.modules.safety.domain.TrainingType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SafetyTrainingRepository extends JpaRepository<SafetyTraining, UUID>,
        JpaSpecificationExecutor<SafetyTraining> {

    Page<SafetyTraining> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<SafetyTraining> findByProjectIdAndTrainingTypeAndDeletedFalse(UUID projectId, TrainingType type, Pageable pageable);

    Page<SafetyTraining> findByStatusAndDeletedFalse(TrainingStatus status, Pageable pageable);

    Page<SafetyTraining> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    @Query("SELECT t FROM SafetyTraining t WHERE t.deleted = false AND t.status = 'COMPLETED' " +
            "AND t.nextScheduledDate IS NOT NULL AND t.nextScheduledDate <= :date")
    List<SafetyTraining> findPeriodicDueForReschedule(@Param("date") LocalDate date);

    @Query("SELECT COUNT(t) FROM SafetyTraining t WHERE t.deleted = false " +
            "AND t.status NOT IN ('COMPLETED', 'CANCELLED') " +
            "AND t.date < :date")
    long countOverdueTrainings(@Param("date") LocalDate date);

    @Query("SELECT COUNT(t) FROM SafetyTraining t WHERE t.deleted = false " +
            "AND t.status = 'PLANNED' AND t.date BETWEEN :from AND :to")
    long countUpcoming(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
