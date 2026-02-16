package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.LegalDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LegalDocumentRepository extends JpaRepository<LegalDocument, UUID> {

    Page<LegalDocument> findByCaseIdAndDeletedFalse(UUID caseId, Pageable pageable);

    List<LegalDocument> findByCaseIdAndDeletedFalseOrderByUploadedAtDesc(UUID caseId);

    long countByCaseIdAndDeletedFalse(UUID caseId);
}
