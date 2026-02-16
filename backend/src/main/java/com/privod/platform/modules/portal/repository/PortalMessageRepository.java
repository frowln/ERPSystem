package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.PortalMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortalMessageRepository extends JpaRepository<PortalMessage, UUID> {

    @Query("SELECT m FROM PortalMessage m WHERE m.deleted = false AND " +
            "(m.toPortalUserId = :portalUserId OR m.toInternalUserId = :internalUserId) " +
            "ORDER BY m.createdAt DESC")
    Page<PortalMessage> findInbox(@Param("portalUserId") UUID portalUserId,
                                   @Param("internalUserId") UUID internalUserId,
                                   Pageable pageable);

    @Query("SELECT m FROM PortalMessage m WHERE m.deleted = false AND " +
            "(m.fromPortalUserId = :portalUserId OR m.fromInternalUserId = :internalUserId) " +
            "ORDER BY m.createdAt DESC")
    Page<PortalMessage> findOutbox(@Param("portalUserId") UUID portalUserId,
                                    @Param("internalUserId") UUID internalUserId,
                                    Pageable pageable);

    List<PortalMessage> findByParentMessageIdAndDeletedFalseOrderByCreatedAtAsc(UUID parentMessageId);

    @Query("SELECT COUNT(m) FROM PortalMessage m WHERE m.deleted = false AND m.isRead = false AND " +
            "(m.toPortalUserId = :portalUserId)")
    long countUnreadByPortalUserId(@Param("portalUserId") UUID portalUserId);
}
