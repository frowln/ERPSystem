package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MessageFavorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageFavoriteRepository extends JpaRepository<MessageFavorite, UUID> {

    @Query("SELECT f FROM MessageFavorite f WHERE f.userId = :userId AND f.deleted = false ORDER BY f.createdAt DESC")
    Page<MessageFavorite> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT f FROM MessageFavorite f WHERE f.messageId = :messageId AND f.userId = :userId AND f.deleted = false")
    Optional<MessageFavorite> findByMessageIdAndUserId(@Param("messageId") UUID messageId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(f) > 0 FROM MessageFavorite f WHERE f.messageId = :messageId AND f.userId = :userId AND f.deleted = false")
    boolean existsByMessageIdAndUserId(@Param("messageId") UUID messageId, @Param("userId") UUID userId);
}
