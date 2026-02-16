package com.privod.platform.modules.integration.weather.repository;

import com.privod.platform.modules.integration.weather.domain.WeatherData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeatherDataRepository extends JpaRepository<WeatherData, UUID> {

    Optional<WeatherData> findFirstByProjectIdAndDeletedFalseOrderByFetchedAtDesc(UUID projectId);

    Page<WeatherData> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<WeatherData> findByProjectIdAndFetchedAtBetweenAndDeletedFalseOrderByFetchedAtDesc(
            UUID projectId, Instant from, Instant to);

    List<WeatherData> findByIsSafeForWorkFalseAndFetchedAtAfterAndDeletedFalse(Instant after);
}
