package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BimVersionRepository extends JpaRepository<BimVersion, UUID> {

    Page<BimVersion> findByModelIdAndDeletedFalse(UUID modelId, Pageable pageable);

    Page<BimVersion> findByDeletedFalse(Pageable pageable);

    List<BimVersion> findByModelIdAndDeletedFalseOrderByVersionNumberDesc(UUID modelId);

    Optional<BimVersion> findTopByModelIdAndDeletedFalseOrderByVersionNumberDesc(UUID modelId);
}
