package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.ZosDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ZosDocumentRepository extends JpaRepository<ZosDocument, UUID>,
        JpaSpecificationExecutor<ZosDocument> {

    Page<ZosDocument> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    List<ZosDocument> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID orgId, UUID projectId);

    Optional<ZosDocument> findByOrganizationIdAndDocumentNumberAndDeletedFalse(UUID orgId, String documentNumber);
}
