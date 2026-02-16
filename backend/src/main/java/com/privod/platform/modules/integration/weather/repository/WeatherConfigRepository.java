package com.privod.platform.modules.integration.weather.repository;

import com.privod.platform.modules.integration.weather.domain.WeatherApiProvider;
import com.privod.platform.modules.integration.weather.domain.WeatherConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeatherConfigRepository extends JpaRepository<WeatherConfig, UUID> {

    Optional<WeatherConfig> findByEnabledTrueAndDeletedFalse();

    List<WeatherConfig> findByDeletedFalse();

    Optional<WeatherConfig> findByApiProviderAndDeletedFalse(WeatherApiProvider apiProvider);

    boolean existsByApiProviderAndDeletedFalse(WeatherApiProvider apiProvider);
}
