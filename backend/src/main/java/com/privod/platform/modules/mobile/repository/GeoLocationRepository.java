package com.privod.platform.modules.mobile.repository;

import com.privod.platform.modules.mobile.domain.GeoLocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface GeoLocationRepository extends JpaRepository<GeoLocation, UUID> {

    Page<GeoLocation> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    List<GeoLocation> findByUserIdAndRecordedAtBetweenAndDeletedFalse(UUID userId, Instant from, Instant to);

    Page<GeoLocation> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);
}
