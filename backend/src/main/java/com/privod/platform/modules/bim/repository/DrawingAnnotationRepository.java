package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.AnnotationStatus;
import com.privod.platform.modules.bim.domain.DrawingAnnotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DrawingAnnotationRepository extends JpaRepository<DrawingAnnotation, UUID> {

    Page<DrawingAnnotation> findByDrawingIdAndDeletedFalse(UUID drawingId, Pageable pageable);

    Page<DrawingAnnotation> findByDeletedFalse(Pageable pageable);

    List<DrawingAnnotation> findByDrawingIdAndStatusAndDeletedFalse(UUID drawingId, AnnotationStatus status);

    long countByDrawingIdAndDeletedFalse(UUID drawingId);
}
