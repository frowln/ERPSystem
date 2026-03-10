package com.privod.platform.modules.email.repository;

import com.privod.platform.modules.email.domain.EmailLog;
import com.privod.platform.modules.email.domain.EmailLogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {

    Page<EmailLog> findByStatusOrderByCreatedAtDesc(EmailLogStatus status, Pageable pageable);

    Page<EmailLog> findByToEmailOrderByCreatedAtDesc(String toEmail, Pageable pageable);

    Page<EmailLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<EmailLog> findByStatusAndCreatedAtBefore(EmailLogStatus status, Instant before);

    long countByStatus(EmailLogStatus status);

    long countByOrganizationIdAndStatus(UUID organizationId, EmailLogStatus status);
}
