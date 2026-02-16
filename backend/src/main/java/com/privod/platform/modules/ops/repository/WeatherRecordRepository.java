package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.WeatherRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeatherRecordRepository extends JpaRepository<WeatherRecord, UUID> {

    Optional<WeatherRecord> findByProjectIdAndRecordDateAndDeletedFalse(UUID projectId, LocalDate recordDate);

    List<WeatherRecord> findByProjectIdAndDeletedFalseOrderByRecordDateDesc(UUID projectId);
}
