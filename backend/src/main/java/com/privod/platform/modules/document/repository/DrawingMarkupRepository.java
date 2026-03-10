package com.privod.platform.modules.document.repository;

import com.privod.platform.modules.document.domain.DrawingMarkup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository("documentDrawingMarkupRepository")
public interface DrawingMarkupRepository extends JpaRepository<DrawingMarkup, UUID> {

    List<DrawingMarkup> findByDocumentIdAndDeletedFalseOrderByCreatedAtDesc(UUID documentId);

    List<DrawingMarkup> findByDocumentIdAndPageNumberAndDeletedFalse(UUID documentId, Integer pageNumber);

    Optional<DrawingMarkup> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);
}
