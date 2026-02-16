package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiDocumentAnalysis;
import com.privod.platform.modules.ai.domain.AnalysisStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiDocumentAnalysisRepository extends JpaRepository<AiDocumentAnalysis, UUID> {

    List<AiDocumentAnalysis> findByDocumentIdAndDeletedFalse(UUID documentId);

    Page<AiDocumentAnalysis> findByStatusAndDeletedFalse(AnalysisStatus status, Pageable pageable);

    Optional<AiDocumentAnalysis> findByIdAndDeletedFalse(UUID id);
}
