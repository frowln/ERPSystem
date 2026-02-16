package com.privod.platform.modules.maintenance.repository;

import com.privod.platform.modules.maintenance.domain.MaintenanceTeam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MaintenanceTeamRepository extends JpaRepository<MaintenanceTeam, UUID>,
        JpaSpecificationExecutor<MaintenanceTeam> {

    Page<MaintenanceTeam> findByDeletedFalse(Pageable pageable);

    @Query("SELECT t FROM MaintenanceTeam t WHERE t.deleted = false AND " +
            "LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<MaintenanceTeam> searchByName(@Param("search") String search, Pageable pageable);
}
