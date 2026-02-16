package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.RegulatoryInspection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegulatoryInspectionRepository extends JpaRepository<RegulatoryInspection, UUID> {

    Optional<RegulatoryInspection> findByIdAndDeletedFalse(UUID id);

    Page<RegulatoryInspection> findByProjectIdInAndDeletedFalse(List<UUID> projectIds, Pageable pageable);

    Page<RegulatoryInspection> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query(value = "SELECT nextval('regulatory_inspection_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
