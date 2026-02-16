package com.privod.platform.modules.chatter.repository;

import com.privod.platform.modules.chatter.domain.Attachment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    Page<Attachment> findByEntityTypeAndEntityIdAndDeletedFalse(
            String entityType, UUID entityId, Pageable pageable);

    long countByEntityTypeAndEntityIdAndDeletedFalse(String entityType, UUID entityId);
}
