package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.EdoDocument;
import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("russianDocEdoDocumentRepository")
public interface EdoDocumentRepository extends JpaRepository<EdoDocument, UUID> {

    Page<EdoDocument> findByDeletedFalse(Pageable pageable);

    Page<EdoDocument> findByDocumentTypeAndDeletedFalse(EdoEnhancedDocumentType documentType, Pageable pageable);

    Page<EdoDocument> findByStatusAndDeletedFalse(EdoEnhancedDocumentStatus status, Pageable pageable);

    Page<EdoDocument> findBySenderIdAndDeletedFalse(UUID senderId, Pageable pageable);

    Page<EdoDocument> findByReceiverIdAndDeletedFalse(UUID receiverId, Pageable pageable);

    Page<EdoDocument> findBySenderInnAndDeletedFalse(String senderInn, Pageable pageable);

    Page<EdoDocument> findByReceiverInnAndDeletedFalse(String receiverInn, Pageable pageable);

    List<EdoDocument> findByLinkedDocumentIdAndDeletedFalse(UUID linkedDocumentId);
}
