package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserStatusRepository extends JpaRepository<UserStatus, UUID> {

    @Query("SELECT s FROM UserStatus s WHERE s.userId = :userId AND s.deleted = false")
    Optional<UserStatus> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM UserStatus s WHERE s.isOnline = true AND s.deleted = false ORDER BY s.lastSeenAt DESC")
    List<UserStatus> findOnlineUsers();

    @Query("SELECT s FROM UserStatus s WHERE s.userId IN :userIds AND s.deleted = false")
    List<UserStatus> findByUserIdIn(@Param("userIds") List<UUID> userIds);
}
