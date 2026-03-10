package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.MaterialInspection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MaterialInspectionRepository extends JpaRepository<MaterialInspection, UUID> {

    Page<MaterialInspection> findByDeletedFalse(Pageable pageable);

    Page<MaterialInspection> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query(value = "SELECT nextval('material_inspection_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
