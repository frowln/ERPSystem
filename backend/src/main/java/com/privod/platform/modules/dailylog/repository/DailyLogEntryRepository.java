package com.privod.platform.modules.dailylog.repository;

import com.privod.platform.modules.dailylog.domain.DailyLogEntry;
import com.privod.platform.modules.dailylog.domain.EntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DailyLogEntryRepository extends JpaRepository<DailyLogEntry, UUID> {

    Page<DailyLogEntry> findByDailyLogIdAndDeletedFalse(UUID dailyLogId, Pageable pageable);

    List<DailyLogEntry> findByDailyLogIdAndDeletedFalse(UUID dailyLogId);

    List<DailyLogEntry> findByDailyLogIdAndEntryTypeAndDeletedFalse(UUID dailyLogId, EntryType entryType);

    long countByDailyLogIdAndDeletedFalse(UUID dailyLogId);
}
