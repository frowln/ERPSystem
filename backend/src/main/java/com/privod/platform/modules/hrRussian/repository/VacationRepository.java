package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.Vacation;
import com.privod.platform.modules.hrRussian.domain.VacationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VacationRepository extends JpaRepository<Vacation, UUID> {

    Page<Vacation> findByDeletedFalse(Pageable pageable);

    List<Vacation> findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(UUID employeeId);

    List<Vacation> findByEmployeeIdAndStatusAndDeletedFalse(UUID employeeId, VacationStatus status);

    @Query("SELECT v FROM Vacation v WHERE v.deleted = false " +
            "AND v.startDate <= :endDate AND v.endDate >= :startDate")
    List<Vacation> findOverlapping(@Param("startDate") LocalDate startDate,
                                   @Param("endDate") LocalDate endDate);

    @Query("SELECT v FROM Vacation v WHERE v.deleted = false " +
            "AND v.employeeId = :employeeId " +
            "AND v.startDate <= :endDate AND v.endDate >= :startDate")
    List<Vacation> findByEmployeeAndDateRange(@Param("employeeId") UUID employeeId,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);
}
