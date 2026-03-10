package com.privod.platform.modules.constructability.repository;

import com.privod.platform.modules.constructability.domain.ConstructabilityItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConstructabilityItemRepository extends JpaRepository<ConstructabilityItem, UUID> {

    List<ConstructabilityItem> findByReviewIdAndDeletedFalseOrderByCreatedAtDesc(UUID reviewId);

    Optional<ConstructabilityItem> findByIdAndDeletedFalse(UUID id);

    long countByReviewIdAndDeletedFalse(UUID reviewId);
}
