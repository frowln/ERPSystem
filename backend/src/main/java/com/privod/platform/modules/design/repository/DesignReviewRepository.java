package com.privod.platform.modules.design.repository;

import com.privod.platform.modules.design.domain.DesignReview;
import com.privod.platform.modules.design.domain.DesignReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DesignReviewRepository extends JpaRepository<DesignReview, UUID> {

    List<DesignReview> findByDesignVersionIdAndDeletedFalse(UUID designVersionId);

    Page<DesignReview> findByReviewerIdAndDeletedFalse(UUID reviewerId, Pageable pageable);

    Page<DesignReview> findByReviewerIdAndStatusAndDeletedFalse(UUID reviewerId, DesignReviewStatus status, Pageable pageable);

    Page<DesignReview> findByDeletedFalse(Pageable pageable);
}
