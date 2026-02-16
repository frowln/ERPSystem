package com.privod.platform.modules.calendar.repository;

import com.privod.platform.modules.calendar.domain.ConstructionSchedule;
import com.privod.platform.modules.calendar.domain.ScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConstructionScheduleRepository extends JpaRepository<ConstructionSchedule, UUID> {

    Page<ConstructionSchedule> findByDeletedFalse(Pageable pageable);

    Page<ConstructionSchedule> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<ConstructionSchedule> findByProjectIdAndDeletedFalseOrderByDocVersionDesc(UUID projectId);

    Optional<ConstructionSchedule> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, ScheduleStatus status);
}
