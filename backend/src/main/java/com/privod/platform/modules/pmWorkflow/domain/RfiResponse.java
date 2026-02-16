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
@Table(name = "rfi_responses", indexes = {
        @Index(name = "idx_rfi_response_rfi", columnList = "rfi_id"),
        @Index(name = "idx_rfi_response_responder", columnList = "responder_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfiResponse extends BaseEntity {

    @Column(name = "rfi_id", nullable = false)
    private UUID rfiId;

    @Column(name = "responder_id", nullable = false)
    private UUID responderId;

    @Column(name = "response_text", columnDefinition = "TEXT", nullable = false)
    private String responseText;

    @Column(name = "attachment_ids", columnDefinition = "JSONB")
    private String attachmentIds;

    @Column(name = "is_official", nullable = false)
    @Builder.Default
    private Boolean isOfficial = false;

    @Column(name = "responded_at")
    private Instant respondedAt;
}
