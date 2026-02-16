package com.privod.platform.modules.ops.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "field_instructions", indexes = {
        @Index(name = "idx_fi_project", columnList = "project_id"),
        @Index(name = "idx_fi_status", columnList = "status"),
        @Index(name = "idx_fi_code", columnList = "code"),
        @Index(name = "idx_fi_issued_by", columnList = "issued_by_id"),
        @Index(name = "idx_fi_received_by", columnList = "received_by_id"),
        @Index(name = "idx_fi_due_date", columnList = "due_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldInstruction extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "issued_by_id")
    private UUID issuedById;

    @Column(name = "received_by_id")
    private UUID receivedById;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private FieldInstructionStatus status = FieldInstructionStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private WorkOrderPriority priority = WorkOrderPriority.MEDIUM;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @Column(name = "responded_at")
    private Instant respondedAt;

    public boolean canTransitionTo(FieldInstructionStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
