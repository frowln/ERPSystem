package com.privod.platform.modules.scheduler.repository;

import com.privod.platform.modules.scheduler.domain.ScheduledJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScheduledJobRepository extends JpaRepository<ScheduledJob, UUID> {

    Optional<ScheduledJob> findByCodeAndDeletedFalse(String code);

    Page<ScheduledJob> findByDeletedFalse(Pageable pageable);

    List<ScheduledJob> findByIsActiveTrueAndDeletedFalse();

    boolean existsByCodeAndDeletedFalse(String code);
}
