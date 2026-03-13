package com.privod.platform.modules.task.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "task_comments", indexes = {
        @Index(name = "idx_task_comment_task", columnList = "task_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskComment extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
}
