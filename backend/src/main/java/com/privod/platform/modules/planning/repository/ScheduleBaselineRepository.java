package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.BaselineType;
import com.privod.platform.modules.planning.domain.ScheduleBaseline;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleBaselineRepository extends JpaRepository<ScheduleBaseline, UUID> {

    Page<ScheduleBaseline> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<ScheduleBaseline> findByDeletedFalse(Pageable pageable);

    List<ScheduleBaseline> findByProjectIdAndBaselineTypeAndDeletedFalse(UUID projectId, BaselineType baselineType);
}
