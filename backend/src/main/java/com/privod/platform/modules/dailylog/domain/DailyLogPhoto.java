package com.privod.platform.modules.dailylog.domain;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "daily_log_photos", indexes = {
        @Index(name = "idx_dlp_daily_log", columnList = "daily_log_id"),
        @Index(name = "idx_dlp_taken_at", columnList = "taken_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLogPhoto extends BaseEntity {

    @Column(name = "daily_log_id", nullable = false)
    private UUID dailyLogId;

    @Column(name = "photo_url", nullable = false, length = 1000)
    private String photoUrl;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "caption", length = 500)
    private String caption;

    @Column(name = "taken_at")
    private Instant takenAt;

    @Column(name = "taken_by_id")
    private UUID takenById;

    @Column(name = "gps_latitude", precision = 10, scale = 7)
    private BigDecimal gpsLatitude;

    @Column(name = "gps_longitude", precision = 10, scale = 7)
    private BigDecimal gpsLongitude;
}
