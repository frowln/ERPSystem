package com.privod.platform.modules.scheduler.service;

import com.privod.platform.modules.scheduler.domain.JobExecution;
import com.privod.platform.modules.scheduler.domain.JobStatus;
import com.privod.platform.modules.scheduler.domain.ScheduledJob;
import com.privod.platform.modules.scheduler.repository.JobExecutionRepository;
import com.privod.platform.modules.scheduler.repository.ScheduledJobRepository;
import com.privod.platform.modules.scheduler.web.dto.CreateScheduledJobRequest;
import com.privod.platform.modules.scheduler.web.dto.JobExecutionResponse;
import com.privod.platform.modules.scheduler.web.dto.ScheduledJobResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private final ScheduledJobRepository jobRepository;
    private final JobExecutionRepository executionRepository;

    @Transactional
    public ScheduledJobResponse register(CreateScheduledJobRequest request) {
        if (jobRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Задание с кодом уже существует: " + request.code());
        }

        ScheduledJob job = ScheduledJob.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .cronExpression(request.cronExpression())
                .jobClass(request.jobClass())
                .jobMethod(request.jobMethod())
                .parameters(request.parameters() != null ? request.parameters() : Map.of())
                .maxRetries(request.maxRetries() != null ? request.maxRetries() : 3)
                .isActive(true)
                .build();

        job = jobRepository.save(job);
        log.info("Scheduled job registered: {} ({}) cron={}", job.getCode(), job.getId(), job.getCronExpression());
        return ScheduledJobResponse.fromEntity(job);
    }

    @Transactional(readOnly = true)
    public Page<ScheduledJobResponse> listJobs(Pageable pageable) {
        return jobRepository.findByDeletedFalse(pageable)
                .map(ScheduledJobResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ScheduledJobResponse getJob(String code) {
        ScheduledJob job = getJobOrThrow(code);
        return ScheduledJobResponse.fromEntity(job);
    }

    @Transactional
    public ScheduledJobResponse enable(String code) {
        ScheduledJob job = getJobOrThrow(code);
        job.setActive(true);
        job = jobRepository.save(job);
        log.info("Scheduled job enabled: {}", code);
        return ScheduledJobResponse.fromEntity(job);
    }

    @Transactional
    public ScheduledJobResponse disable(String code) {
        ScheduledJob job = getJobOrThrow(code);
        job.setActive(false);
        job = jobRepository.save(job);
        log.info("Scheduled job disabled: {}", code);
        return ScheduledJobResponse.fromEntity(job);
    }

    @Transactional
    public JobExecutionResponse triggerManualRun(String code) {
        ScheduledJob job = getJobOrThrow(code);

        JobExecution execution = JobExecution.builder()
                .jobId(job.getId())
                .startedAt(Instant.now())
                .status(JobStatus.RUNNING)
                .build();
        execution = executionRepository.save(execution);

        try {
            // In production, use Spring ApplicationContext to resolve bean and invoke method
            // For now, simulate execution
            log.info("Manual run triggered for job: {} (class={}, method={})",
                    code, job.getJobClass(), job.getJobMethod());

            execution.markSuccess("Manual execution completed successfully");
            job.recordSuccess();
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            execution.markFailed(e.getMessage(), sw.toString());
            job.recordFailure();
            log.error("Job execution failed for {}: {}", code, e.getMessage());
        }

        executionRepository.save(execution);
        jobRepository.save(job);
        return JobExecutionResponse.fromEntity(execution);
    }

    @Transactional(readOnly = true)
    public Page<JobExecutionResponse> getExecutions(String code, Pageable pageable) {
        ScheduledJob job = getJobOrThrow(code);
        return executionRepository.findByJobIdAndDeletedFalse(job.getId(), pageable)
                .map(JobExecutionResponse::fromEntity);
    }

    private ScheduledJob getJobOrThrow(String code) {
        return jobRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Задание не найдено: " + code));
    }
}
