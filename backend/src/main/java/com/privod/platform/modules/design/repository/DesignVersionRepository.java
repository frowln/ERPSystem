package com.privod.platform.modules.design.repository;

import com.privod.platform.modules.design.domain.DesignVersion;
import com.privod.platform.modules.design.domain.DesignVersionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DesignVersionRepository extends JpaRepository<DesignVersion, UUID> {

    Page<DesignVersion> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<DesignVersion> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, DesignVersionStatus status, Pageable pageable);

    List<DesignVersion> findByDocumentIdAndDeletedFalseOrderByCreatedAtDesc(UUID documentId);

    Page<DesignVersion> findByDeletedFalse(Pageable pageable);
}
