package com.privod.platform.modules.common.repository;

import com.privod.platform.modules.common.domain.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, UUID> {

    List<FileAttachment> findByEntityTypeAndEntityIdAndDeletedFalseOrderByCreatedAtDesc(
            String entityType, UUID entityId);
}
