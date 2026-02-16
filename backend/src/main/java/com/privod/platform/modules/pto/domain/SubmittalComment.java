package com.privod.platform.modules.pto.domain;

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

import java.util.UUID;

@Entity
@Table(name = "submittal_comments", indexes = {
        @Index(name = "idx_sub_comment_submittal", columnList = "submittal_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmittalComment extends BaseEntity {

    @Column(name = "submittal_id", nullable = false)
    private UUID submittalId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "attachment_url", length = 1000)
    private String attachmentUrl;
}
