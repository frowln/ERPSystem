package com.privod.platform.modules.integration.weather.domain;

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

@Entity
@Table(name = "weather_configs", indexes = {
        @Index(name = "idx_weather_cfg_provider", columnList = "api_provider"),
        @Index(name = "idx_weather_cfg_enabled", columnList = "enabled")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherConfig extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "api_provider", nullable = false, length = 30)
    private WeatherApiProvider apiProvider;

    @Column(name = "api_key", length = 500)
    private String apiKey;

    @Column(name = "default_city", length = 255)
    private String defaultCity;

    @Column(name = "default_latitude")
    private Double defaultLatitude;

    @Column(name = "default_longitude")
    private Double defaultLongitude;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "refresh_interval_minutes", nullable = false)
    @Builder.Default
    private int refreshIntervalMinutes = 60;
}
