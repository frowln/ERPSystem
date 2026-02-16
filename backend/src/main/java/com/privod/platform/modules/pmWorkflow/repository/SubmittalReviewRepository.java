package com.privod.platform.modules.pmWorkflow.repository;

import com.privod.platform.modules.pmWorkflow.domain.SubmittalReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmittalReviewRepository extends JpaRepository<SubmittalReview, UUID> {

    Page<SubmittalReview> findBySubmittalIdAndDeletedFalse(UUID submittalId, Pageable pageable);

    List<SubmittalReview> findBySubmittalIdAndDeletedFalseOrderByReviewedAtDesc(UUID submittalId);

    long countBySubmittalIdAndDeletedFalse(UUID submittalId);
}
