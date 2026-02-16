package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.EdoDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoGeneratedDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EdoGeneratedDocumentRepository extends JpaRepository<EdoGeneratedDocument, UUID> {

    Page<EdoGeneratedDocument> findByDeletedFalse(Pageable pageable);

    List<EdoGeneratedDocument> findBySourceDocumentTypeAndSourceDocumentIdAndDeletedFalse(
            String sourceDocumentType, UUID sourceDocumentId);

    List<EdoGeneratedDocument> findByStatusAndDeletedFalse(EdoDocumentStatus status);
}
