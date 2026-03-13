package com.privod.platform.modules.edo.repository;

import com.privod.platform.modules.edo.domain.EdoDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EdoDocumentRepository extends JpaRepository<EdoDocument, UUID> {

    List<EdoDocument> findBySourceTypeAndSourceIdAndDeletedFalse(String sourceType, UUID sourceId);

    List<EdoDocument> findByConfigIdAndDeletedFalseOrderByCreatedAtDesc(UUID configId);

    Optional<EdoDocument> findByIdAndDeletedFalse(UUID id);
}
