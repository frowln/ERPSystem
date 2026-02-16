package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.DrawingMarkup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DrawingMarkupRepository extends JpaRepository<DrawingMarkup, UUID> {

    Page<DrawingMarkup> findByDrawingIdAndDeletedFalse(UUID drawingId, Pageable pageable);

    Page<DrawingMarkup> findByDeletedFalse(Pageable pageable);
}
