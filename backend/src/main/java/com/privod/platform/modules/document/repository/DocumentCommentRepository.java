package com.privod.platform.modules.document.repository;

import com.privod.platform.modules.document.domain.DocumentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentCommentRepository extends JpaRepository<DocumentComment, UUID> {

    List<DocumentComment> findByDocumentIdAndDeletedFalseOrderByCreatedAtAsc(UUID documentId);
}
