package com.privod.platform.modules.closing.repository;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks3Document;
import com.privod.platform.modules.closing.domain.OneCPostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface Ks3DocumentRepository extends JpaRepository<Ks3Document, UUID>, JpaSpecificationExecutor<Ks3Document> {

    Page<Ks3Document> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Ks3Document> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    Page<Ks3Document> findByStatusAndDeletedFalse(ClosingDocumentStatus status, Pageable pageable);

    List<Ks3Document> findByOneCPostingStatusAndDeletedFalse(OneCPostingStatus oneCPostingStatus);
}
