package com.privod.platform.modules.recruitment.repository;

import com.privod.platform.modules.recruitment.domain.Interview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    Page<Interview> findByApplicantIdAndDeletedFalse(UUID applicantId, Pageable pageable);

    List<Interview> findByApplicantIdAndDeletedFalse(UUID applicantId);

    Page<Interview> findByInterviewerIdAndDeletedFalse(UUID interviewerId, Pageable pageable);

    @Query("SELECT i FROM Interview i WHERE i.deleted = false AND " +
            "i.scheduledAt BETWEEN :start AND :end ORDER BY i.scheduledAt ASC")
    List<Interview> findByScheduledAtBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    Page<Interview> findByDeletedFalse(Pageable pageable);
}
