package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.OcrTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OcrTemplateRepository extends JpaRepository<OcrTemplate, UUID> {

    Page<OcrTemplate> findByDeletedFalse(Pageable pageable);

    Optional<OcrTemplate> findByDocumentTypeAndIsActiveTrueAndDeletedFalse(String documentType);

    List<OcrTemplate> findByIsActiveTrueAndDeletedFalse();
}
