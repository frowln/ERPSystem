package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.ReportingSubmission;
import com.privod.platform.modules.regulatory.domain.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportingSubmissionRepository extends JpaRepository<ReportingSubmission, UUID>, JpaSpecificationExecutor<ReportingSubmission> {

    Page<ReportingSubmission> findByDeadlineIdAndDeletedFalseOrderBySubmissionDateDesc(
            UUID deadlineId, Pageable pageable);

    List<ReportingSubmission> findByDeadlineIdAndDeletedFalse(UUID deadlineId);

    Page<ReportingSubmission> findByStatusAndDeletedFalseOrderBySubmissionDateDesc(
            SubmissionStatus status, Pageable pageable);

    List<ReportingSubmission> findBySubmittedByIdAndDeletedFalse(UUID submittedById);
}
