package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.PtoDocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PtoDocumentVersionRepository extends JpaRepository<PtoDocumentVersion, UUID> {

    List<PtoDocumentVersion> findByDocumentIdAndDeletedFalseOrderByVersionNumberDesc(UUID documentId);

    long countByDocumentIdAndDeletedFalse(UUID documentId);
}
