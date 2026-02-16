package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.Channel;
import com.privod.platform.modules.messaging.domain.ChannelType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, UUID>, JpaSpecificationExecutor<Channel> {

    @Query("SELECT c FROM Channel c WHERE c.deleted = false AND c.id IN " +
            "(SELECT cm.channelId FROM ChannelMember cm WHERE cm.userId = :userId AND cm.deleted = false) " +
            "ORDER BY c.isPinned DESC, c.lastMessageAt DESC NULLS LAST")
    Page<Channel> findMyChannels(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM Channel c WHERE c.deleted = false AND c.isArchived = false " +
            "AND (c.channelType = 'PUBLIC' OR c.id IN " +
            "(SELECT cm.channelId FROM ChannelMember cm WHERE cm.userId = :userId AND cm.deleted = false)) " +
            "AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Channel> searchChannels(@Param("userId") UUID userId, @Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Channel c WHERE c.deleted = false AND c.channelType = 'DIRECT' " +
            "AND c.id IN (SELECT cm1.channelId FROM ChannelMember cm1 WHERE cm1.userId = :userId1 AND cm1.deleted = false) " +
            "AND c.id IN (SELECT cm2.channelId FROM ChannelMember cm2 WHERE cm2.userId = :userId2 AND cm2.deleted = false)")
    List<Channel> findDirectChannelBetween(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    @Query("SELECT c FROM Channel c WHERE c.deleted = false AND c.projectId = :projectId AND c.isArchived = false")
    List<Channel> findByProjectId(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('channel_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
