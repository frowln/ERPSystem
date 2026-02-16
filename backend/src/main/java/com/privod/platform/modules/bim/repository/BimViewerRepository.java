package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimViewer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BimViewerRepository extends JpaRepository<BimViewer, UUID> {

    Page<BimViewer> findByModelIdAndDeletedFalse(UUID modelId, Pageable pageable);

    Page<BimViewer> findByDeletedFalse(Pageable pageable);

    List<BimViewer> findByModelIdAndIsDefaultTrueAndDeletedFalse(UUID modelId);
}
