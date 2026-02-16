package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyInspection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SafetyInspectionRepository extends JpaRepository<SafetyInspection, UUID>,
        JpaSpecificationExecutor<SafetyInspection> {

    Page<SafetyInspection> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query(value = "SELECT nextval('inspection_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
