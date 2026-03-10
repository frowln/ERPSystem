package com.privod.platform.modules.email.repository;

import com.privod.platform.modules.email.domain.EmailAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmailAttachmentRepository extends JpaRepository<EmailAttachment, UUID> {

    List<EmailAttachment> findByEmailMessageId(UUID emailId);
}
