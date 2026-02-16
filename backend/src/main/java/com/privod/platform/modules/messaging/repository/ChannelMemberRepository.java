package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.ChannelMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChannelMemberRepository extends JpaRepository<ChannelMember, UUID> {

    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channelId = :channelId AND cm.deleted = false ORDER BY cm.role, cm.userName")
    List<ChannelMember> findByChannelId(@Param("channelId") UUID channelId);

    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channelId = :channelId AND cm.userId = :userId AND cm.deleted = false")
    Optional<ChannelMember> findByChannelIdAndUserId(@Param("channelId") UUID channelId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(cm) > 0 FROM ChannelMember cm WHERE cm.channelId = :channelId AND cm.userId = :userId AND cm.deleted = false")
    boolean existsByChannelIdAndUserId(@Param("channelId") UUID channelId, @Param("userId") UUID userId);

    @Query("SELECT cm FROM ChannelMember cm WHERE cm.userId = :userId AND cm.deleted = false")
    List<ChannelMember> findByUserId(@Param("userId") UUID userId);
}
