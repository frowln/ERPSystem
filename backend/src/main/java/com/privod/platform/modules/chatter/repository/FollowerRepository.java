package com.privod.platform.modules.chatter.repository;

import com.privod.platform.modules.chatter.domain.Follower;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FollowerRepository extends JpaRepository<Follower, UUID> {

    List<Follower> findByEntityTypeAndEntityIdAndIsActiveTrue(String entityType, UUID entityId);

    Optional<Follower> findByEntityTypeAndEntityIdAndUserId(
            String entityType, UUID entityId, UUID userId);

    boolean existsByEntityTypeAndEntityIdAndUserIdAndIsActiveTrue(
            String entityType, UUID entityId, UUID userId);

    List<Follower> findByUserIdAndIsActiveTrue(UUID userId);
}
