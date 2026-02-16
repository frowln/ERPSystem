package com.privod.platform.modules.integration.weather.domain;

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
@Table(name = "weather_data", indexes = {
        @Index(name = "idx_weather_data_project", columnList = "project_id"),
        @Index(name = "idx_weather_data_fetched", columnList = "fetched_at"),
        @Index(name = "idx_weather_data_safe", columnList = "is_safe_for_work"),
        @Index(name = "idx_weather_data_condition", columnList = "weather_condition")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherData extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "location_name", length = 255)
    private String locationName;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "feels_like")
    private Double feelsLike;

    @Column(name = "humidity")
    private Integer humidity;

    @Column(name = "wind_speed")
    private Double windSpeed;

    @Column(name = "wind_direction", length = 10)
    private String windDirection;

    @Column(name = "weather_condition", length = 50)
    private String weatherCondition;

    @Column(name = "weather_description", length = 500)
    private String weatherDescription;

    @Column(name = "pressure")
    private Double pressure;

    @Column(name = "visibility")
    private Integer visibility;

    @Column(name = "is_safe_for_work", nullable = false)
    @Builder.Default
    private boolean isSafeForWork = true;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;
}
