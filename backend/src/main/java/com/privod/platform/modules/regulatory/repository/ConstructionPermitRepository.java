package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.ConstructionPermit;
import com.privod.platform.modules.regulatory.domain.PermitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConstructionPermitRepository extends JpaRepository<ConstructionPermit, UUID> {

    Optional<ConstructionPermit> findByIdAndDeletedFalse(UUID id);

    Page<ConstructionPermit> findByProjectIdInAndDeletedFalse(List<UUID> projectIds, Pageable pageable);

    Page<ConstructionPermit> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<ConstructionPermit> findByStatusAndDeletedFalse(PermitStatus status);
}
