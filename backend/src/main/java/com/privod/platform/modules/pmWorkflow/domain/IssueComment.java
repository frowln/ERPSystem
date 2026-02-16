package com.privod.platform.modules.pmWorkflow.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pm_issue_comments", indexes = {
        @Index(name = "idx_pm_issue_comment_issue", columnList = "issue_id"),
        @Index(name = "idx_pm_issue_comment_author", columnList = "author_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueComment extends BaseEntity {

    @Column(name = "issue_id", nullable = false)
    private UUID issueId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "comment_text", columnDefinition = "TEXT", nullable = false)
    private String commentText;

    @Column(name = "attachment_ids", columnDefinition = "JSONB")
    private String attachmentIds;

    @Column(name = "posted_at")
    private Instant postedAt;
}
