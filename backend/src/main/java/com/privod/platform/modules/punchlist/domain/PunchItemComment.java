package com.privod.platform.modules.punchlist.domain;

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
@Table(name = "punch_item_comments", indexes = {
        @Index(name = "idx_punch_comment_item", columnList = "punch_item_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PunchItemComment extends BaseEntity {

    @Column(name = "punch_item_id")
    private UUID punchItemId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "attachment_url", length = 1000)
    private String attachmentUrl;
}
