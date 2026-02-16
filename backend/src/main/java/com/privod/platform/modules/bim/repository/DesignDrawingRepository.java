package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.DesignDrawing;
import com.privod.platform.modules.bim.domain.DrawingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DesignDrawingRepository extends JpaRepository<DesignDrawing, UUID> {

    Page<DesignDrawing> findByPackageIdAndDeletedFalse(UUID packageId, Pageable pageable);

    Page<DesignDrawing> findByDeletedFalse(Pageable pageable);

    List<DesignDrawing> findByPackageIdAndStatusAndDeletedFalse(UUID packageId, DrawingStatus status);
}
