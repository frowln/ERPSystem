package com.privod.platform.modules.cde.repository;

import com.privod.platform.modules.cde.domain.DocumentRevision;
import com.privod.platform.modules.cde.domain.RevisionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRevisionRepository extends JpaRepository<DocumentRevision, UUID> {

    List<DocumentRevision> findByDocumentContainerIdAndDeletedFalseOrderByCreatedAtDesc(UUID documentContainerId);

    Page<DocumentRevision> findByDocumentContainerIdAndDeletedFalse(UUID documentContainerId, Pageable pageable);

    List<DocumentRevision> findByDocumentContainerIdAndRevisionStatusAndDeletedFalse(
            UUID documentContainerId, RevisionStatus status);
}
