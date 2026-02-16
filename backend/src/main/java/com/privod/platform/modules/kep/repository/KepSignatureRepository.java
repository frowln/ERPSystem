package com.privod.platform.modules.kep.repository;

import com.privod.platform.modules.kep.domain.KepSignature;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KepSignatureRepository extends JpaRepository<KepSignature, UUID> {

    List<KepSignature> findByDocumentModelAndDocumentIdAndDeletedFalse(String documentModel, UUID documentId);

    Page<KepSignature> findByCertificateIdAndDeletedFalse(UUID certificateId, Pageable pageable);

    long countByDocumentModelAndDocumentIdAndDeletedFalse(String documentModel, UUID documentId);

    boolean existsBySignatureHashAndDeletedFalse(String signatureHash);
}
