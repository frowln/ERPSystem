package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.CrewTimeEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CrewTimeEntryRepository extends JpaRepository<CrewTimeEntry, UUID> {

    Page<CrewTimeEntry> findByCrewIdAndDeletedFalse(UUID crewId, Pageable pageable);

    Page<CrewTimeEntry> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    List<CrewTimeEntry> findByCrewIdAndWorkDateBetweenAndDeletedFalse(
            UUID crewId, LocalDate startDate, LocalDate endDate);

    List<CrewTimeEntry> findByCrewIdAndProjectIdAndWorkDateBetweenAndDeletedFalse(
            UUID crewId, UUID projectId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.hoursWorked), 0) FROM CrewTimeEntry e " +
            "WHERE e.crewId = :crewId AND e.workDate BETWEEN :startDate AND :endDate " +
            "AND e.deleted = false")
    BigDecimal sumHoursByCrewAndDateRange(
            @Param("crewId") UUID crewId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
