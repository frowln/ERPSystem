package com.privod.platform.modules.document.repository;

import com.privod.platform.modules.document.domain.DocumentAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentAccessRepository extends JpaRepository<DocumentAccess, UUID> {

    List<DocumentAccess> findByDocumentIdAndDeletedFalse(UUID documentId);

    Optional<DocumentAccess> findByDocumentIdAndUserIdAndDeletedFalse(UUID documentId, UUID userId);

    boolean existsByDocumentIdAndUserIdAndDeletedFalse(UUID documentId, UUID userId);
}
