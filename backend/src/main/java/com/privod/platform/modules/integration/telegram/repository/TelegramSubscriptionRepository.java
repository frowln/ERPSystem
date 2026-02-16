package com.privod.platform.modules.integration.telegram.repository;

import com.privod.platform.modules.integration.telegram.domain.TelegramSubscription;
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
public interface TelegramSubscriptionRepository extends JpaRepository<TelegramSubscription, UUID> {

    Page<TelegramSubscription> findByDeletedFalse(Pageable pageable);

    List<TelegramSubscription> findByUserIdAndDeletedFalse(UUID userId);

    Optional<TelegramSubscription> findByUserIdAndActiveAndDeletedFalse(UUID userId, boolean active);

    Optional<TelegramSubscription> findByChatIdAndDeletedFalse(String chatId);

    List<TelegramSubscription> findByActiveAndDeletedFalse(boolean active);

    @Query("SELECT s FROM TelegramSubscription s WHERE s.active = true AND s.deleted = false " +
            "AND s.notifyProjects = true AND s.userId IN :userIds")
    List<TelegramSubscription> findActiveProjectSubscribers(@Param("userIds") List<UUID> userIds);

    @Query("SELECT s FROM TelegramSubscription s WHERE s.active = true AND s.deleted = false " +
            "AND s.notifySafety = true")
    List<TelegramSubscription> findActiveSafetySubscribers();

    @Query("SELECT s FROM TelegramSubscription s WHERE s.active = true AND s.deleted = false " +
            "AND s.notifyTasks = true AND s.userId = :userId")
    Optional<TelegramSubscription> findActiveTaskSubscriber(@Param("userId") UUID userId);

    @Query("SELECT s FROM TelegramSubscription s WHERE s.active = true AND s.deleted = false " +
            "AND s.notifyApprovals = true AND s.userId = :userId")
    Optional<TelegramSubscription> findActiveApprovalSubscriber(@Param("userId") UUID userId);

    boolean existsByUserIdAndChatIdAndDeletedFalse(UUID userId, String chatId);
}
