package com.privod.platform.modules.bim.domain;

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
import java.util.UUID;

@Entity
@Table(name = "photo_progress", indexes = {
        @Index(name = "idx_photo_progress_project", columnList = "project_id"),
        @Index(name = "idx_photo_progress_taken", columnList = "taken_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoProgress extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "photo_url", nullable = false, length = 1000)
    private String photoUrl;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "taken_at")
    private Instant takenAt;

    @Column(name = "taken_by_id")
    private UUID takenById;

    @Enumerated(EnumType.STRING)
    @Column(name = "weather_condition", length = 30)
    private WeatherCondition weatherCondition;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
