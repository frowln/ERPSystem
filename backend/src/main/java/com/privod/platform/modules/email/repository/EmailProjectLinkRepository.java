package com.privod.platform.modules.email.repository;

import com.privod.platform.modules.email.domain.EmailProjectLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailProjectLinkRepository extends JpaRepository<EmailProjectLink, UUID> {

    List<EmailProjectLink> findByProjectId(UUID projectId);

    List<EmailProjectLink> findByEmailMessageId(UUID emailId);

    Optional<EmailProjectLink> findByEmailMessageIdAndProjectId(UUID emailId, UUID projectId);

    boolean existsByEmailMessageIdAndProjectId(UUID emailId, UUID projectId);

    @Query("SELECT l.emailMessage.id FROM EmailProjectLink l WHERE l.projectId = :projectId")
    List<UUID> findEmailIdsByProjectId(@Param("projectId") UUID projectId);
}
