package com.privod.platform.modules.closing.repository;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.OneCPostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface Ks2DocumentRepository extends JpaRepository<Ks2Document, UUID>, JpaSpecificationExecutor<Ks2Document> {

    Page<Ks2Document> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Ks2Document> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    Page<Ks2Document> findByStatusAndDeletedFalse(ClosingDocumentStatus status, Pageable pageable);

    Page<Ks2Document> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, ClosingDocumentStatus status, Pageable pageable);

    List<Ks2Document> findByOneCPostingStatusAndDeletedFalse(OneCPostingStatus oneCPostingStatus);
}
