package com.privod.platform.modules.mobile.repository;

import com.privod.platform.modules.mobile.domain.FieldReport;
import com.privod.platform.modules.mobile.domain.FieldReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FieldReportRepository extends JpaRepository<FieldReport, UUID>, JpaSpecificationExecutor<FieldReport> {

    Optional<FieldReport> findByIdAndDeletedFalse(UUID id);

    Page<FieldReport> findByDeletedFalse(Pageable pageable);

    Page<FieldReport> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<FieldReport> findByAuthorIdAndDeletedFalse(UUID authorId, Pageable pageable);

    Page<FieldReport> findByStatusAndDeletedFalse(FieldReportStatus status, Pageable pageable);

    List<FieldReport> findByAuthorIdAndReportDateAndDeletedFalse(UUID authorId, LocalDate reportDate);

    long countByAuthorIdAndDeletedFalse(UUID authorId);

    long countByAuthorIdAndStatusAndDeletedFalse(UUID authorId, FieldReportStatus status);

    long countByProjectIdAndReportDateAndDeletedFalse(UUID projectId, LocalDate reportDate);

    @Query(value = "SELECT nextval('field_report_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
