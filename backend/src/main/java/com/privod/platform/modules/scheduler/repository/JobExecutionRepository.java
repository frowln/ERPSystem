package com.privod.platform.modules.scheduler.repository;

import com.privod.platform.modules.scheduler.domain.JobExecution;
import com.privod.platform.modules.scheduler.domain.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobExecutionRepository extends JpaRepository<JobExecution, UUID> {

    Page<JobExecution> findByJobIdAndDeletedFalse(UUID jobId, Pageable pageable);

    List<JobExecution> findByStatusAndDeletedFalse(JobStatus status);
}
