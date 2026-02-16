package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.StaffingTable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StaffingTableRepository extends JpaRepository<StaffingTable, UUID> {

    Page<StaffingTable> findByActiveTrueAndDeletedFalse(Pageable pageable);

    List<StaffingTable> findByDepartmentIdAndActiveTrueAndDeletedFalse(UUID departmentId);

    @Query("SELECT st FROM StaffingTable st WHERE st.active = true AND st.deleted = false " +
            "AND st.filledCount < st.headcount")
    List<StaffingTable> findVacantPositions();
}
