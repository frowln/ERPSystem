package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.CrewTimeSheet;
import com.privod.platform.modules.hr.domain.CrewTimeSheetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrewTimeSheetRepository extends JpaRepository<CrewTimeSheet, UUID> {

    Page<CrewTimeSheet> findByCrewIdAndDeletedFalse(UUID crewId, Pageable pageable);

    Page<CrewTimeSheet> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<CrewTimeSheet> findByStatusAndDeletedFalse(CrewTimeSheetStatus status, Pageable pageable);

    List<CrewTimeSheet> findByCrewIdAndProjectIdAndDeletedFalse(UUID crewId, UUID projectId);

    Page<CrewTimeSheet> findByDeletedFalse(Pageable pageable);
}
