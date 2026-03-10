package com.privod.platform.modules.email.repository;

import com.privod.platform.modules.email.domain.EmailMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailMessageRepository extends JpaRepository<EmailMessage, UUID> {

    Page<EmailMessage> findByFolderOrderByReceivedAtDesc(String folder, Pageable pageable);

    List<EmailMessage> findByIsReadFalseAndFolder(String folder);

    boolean existsByMessageUidAndFolder(String messageUid, String folder);

    Optional<EmailMessage> findTopByFolderOrderByMessageUidDesc(String folder);

    @Query("SELECT COUNT(e) FROM EmailMessage e WHERE e.isRead = false AND e.folder = :folder")
    long countUnreadByFolder(@Param("folder") String folder);

    @Query("SELECT e FROM EmailMessage e WHERE e.folder = :folder AND " +
            "(LOWER(e.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.fromAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.fromName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY e.receivedAt DESC")
    Page<EmailMessage> searchInFolder(@Param("folder") String folder,
                                      @Param("search") String search,
                                      Pageable pageable);

    @Query("SELECT e FROM EmailMessage e WHERE " +
            "(LOWER(e.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.fromAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.fromName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY e.receivedAt DESC")
    Page<EmailMessage> searchAll(@Param("search") String search, Pageable pageable);

    Optional<EmailMessage> findByMessageIdHeader(String messageIdHeader);

    long countByFolder(String folder);
}
