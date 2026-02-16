package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.EdoSignature;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EdoSignatureRepository extends JpaRepository<EdoSignature, UUID> {

    List<EdoSignature> findByEdoDocumentIdAndDeletedFalse(UUID edoDocumentId);

    Page<EdoSignature> findBySignerIdAndDeletedFalse(UUID signerId, Pageable pageable);

    List<EdoSignature> findByEdoDocumentIdAndIsValidAndDeletedFalse(UUID edoDocumentId, boolean isValid);
}
