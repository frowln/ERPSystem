package com.privod.platform.modules.support.domain;

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
@Table(name = "ticket_comments", indexes = {
        @Index(name = "idx_ticket_comment_ticket", columnList = "ticket_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketComment extends BaseEntity {

    @Column(name = "ticket_id")
    private UUID ticketId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_internal", nullable = false)
    @Builder.Default
    private boolean isInternal = false;

    @Column(name = "attachment_urls", columnDefinition = "JSONB")
    private String attachmentUrls;
}
