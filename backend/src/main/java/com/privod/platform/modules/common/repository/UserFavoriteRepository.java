package com.privod.platform.modules.common.repository;

import com.privod.platform.modules.common.domain.UserFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, UUID> {

    List<UserFavorite> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(UUID userId);

    List<UserFavorite> findByUserIdAndEntityTypeAndDeletedFalseOrderByCreatedAtDesc(UUID userId, String entityType);

    Optional<UserFavorite> findByUserIdAndEntityTypeAndEntityIdAndDeletedFalse(UUID userId, String entityType, UUID entityId);

    void deleteByUserIdAndEntityTypeAndEntityId(UUID userId, String entityType, UUID entityId);

    long countByUserIdAndEntityTypeAndDeletedFalse(UUID userId, String entityType);

    boolean existsByUserIdAndEntityTypeAndEntityIdAndDeletedFalse(UUID userId, String entityType, UUID entityId);
}
