package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.CrewReportStatus;
import com.privod.platform.modules.hrRussian.domain.CrewTimeReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CrewTimeReportRepository extends JpaRepository<CrewTimeReport, UUID> {

    Page<CrewTimeReport> findByCrewIdAndDeletedFalse(UUID crewId, Pageable pageable);

    Page<CrewTimeReport> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<CrewTimeReport> findByCrewIdAndReportDateBetweenAndDeletedFalse(
            UUID crewId, LocalDate startDate, LocalDate endDate);

    List<CrewTimeReport> findByStatusAndDeletedFalse(CrewReportStatus status);
}
