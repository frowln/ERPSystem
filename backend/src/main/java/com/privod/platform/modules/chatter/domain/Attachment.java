package com.privod.platform.modules.chatter.domain;

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
@Table(name = "chatter_attachments", indexes = {
        @Index(name = "idx_attachment_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_attachment_uploaded_by", columnList = "uploaded_by_id"),
        @Index(name = "idx_attachment_uploaded_at", columnList = "uploaded_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "file_size", nullable = false)
    @Builder.Default
    private long fileSize = 0;

    @Column(name = "mime_type", length = 255)
    private String mimeType;

    @Column(name = "uploaded_by_id", nullable = false)
    private UUID uploadedById;

    @Column(name = "uploaded_at", nullable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();
}
