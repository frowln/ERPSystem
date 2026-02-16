package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.OccupancyPermit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OccupancyPermitRepository extends JpaRepository<OccupancyPermit, UUID> {

    Page<OccupancyPermit> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);
}
