package com.privod.platform.modules.pmWorkflow.repository;

import com.privod.platform.modules.pmWorkflow.domain.IssueComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IssueCommentRepository extends JpaRepository<IssueComment, UUID> {

    Page<IssueComment> findByIssueIdAndDeletedFalse(UUID issueId, Pageable pageable);

    List<IssueComment> findByIssueIdAndDeletedFalseOrderByPostedAtDesc(UUID issueId);

    long countByIssueIdAndDeletedFalse(UUID issueId);
}
