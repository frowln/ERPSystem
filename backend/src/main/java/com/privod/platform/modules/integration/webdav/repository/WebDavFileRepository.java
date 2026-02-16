package com.privod.platform.modules.integration.webdav.repository;

import com.privod.platform.modules.integration.webdav.domain.WebDavFile;
import com.privod.platform.modules.integration.webdav.domain.WebDavSyncStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebDavFileRepository extends JpaRepository<WebDavFile, UUID> {

    Page<WebDavFile> findByDeletedFalse(Pageable pageable);

    Page<WebDavFile> findBySyncStatusAndDeletedFalse(WebDavSyncStatus syncStatus, Pageable pageable);

    Optional<WebDavFile> findByLocalDocumentIdAndDeletedFalse(UUID localDocumentId);

    Optional<WebDavFile> findByRemotePathAndDeletedFalse(String remotePath);

    List<WebDavFile> findBySyncStatusInAndDeletedFalse(List<WebDavSyncStatus> statuses);

    List<WebDavFile> findBySyncStatusAndDeletedFalseOrderByCreatedAtAsc(WebDavSyncStatus syncStatus);

    long countBySyncStatusAndDeletedFalse(WebDavSyncStatus syncStatus);

    // --- Tenant-scoped variants ---

    Page<WebDavFile> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<WebDavFile> findByOrganizationIdAndSyncStatusAndDeletedFalse(UUID organizationId, WebDavSyncStatus syncStatus, Pageable pageable);

    Optional<WebDavFile> findByOrganizationIdAndLocalDocumentIdAndDeletedFalse(UUID organizationId, UUID localDocumentId);

    Optional<WebDavFile> findByOrganizationIdAndRemotePathAndDeletedFalse(UUID organizationId, String remotePath);

    List<WebDavFile> findByOrganizationIdAndSyncStatusInAndDeletedFalse(UUID organizationId, List<WebDavSyncStatus> statuses);

    List<WebDavFile> findByOrganizationIdAndSyncStatusAndDeletedFalseOrderByCreatedAtAsc(UUID organizationId, WebDavSyncStatus syncStatus);

    long countByOrganizationIdAndSyncStatusAndDeletedFalse(UUID organizationId, WebDavSyncStatus syncStatus);
}
