package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.PtoDocument;
import com.privod.platform.modules.pto.domain.PtoDocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PtoDocumentRepository extends JpaRepository<PtoDocument, UUID>, JpaSpecificationExecutor<PtoDocument> {

    Page<PtoDocument> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<PtoDocument> findByProjectIdAndDeletedFalse(UUID projectId);

    Page<PtoDocument> findByStatusAndDeletedFalse(PtoDocumentStatus status, Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
