package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.SubmittalComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmittalCommentRepository extends JpaRepository<SubmittalComment, UUID> {

    List<SubmittalComment> findBySubmittalIdAndDeletedFalseOrderByCreatedAtDesc(UUID submittalId);

    long countBySubmittalIdAndDeletedFalse(UUID submittalId);
}
