package com.privod.platform.modules.task.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_time_entries", indexes = {
    @Index(name = "idx_time_entry_task", columnList = "task_id"),
    @Index(name = "idx_time_entry_user", columnList = "user_id")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskTimeEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", length = 255)
    private String userName;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "stopped_at")
    private Instant stoppedAt;

    @Column(name = "duration_seconds")
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_running")
    @Builder.Default
    private Boolean isRunning = false;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
