package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.Ks6aRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface Ks6aRecordRepository extends JpaRepository<Ks6aRecord, UUID> {

    Page<Ks6aRecord> findByKs6JournalIdAndDeletedFalse(UUID ks6JournalId, Pageable pageable);

    List<Ks6aRecord> findByKs6JournalIdAndMonthYearAndDeletedFalse(UUID ks6JournalId, String monthYear);

    List<Ks6aRecord> findByKs6JournalIdAndDeletedFalseOrderByMonthYear(UUID ks6JournalId);

    long countByKs6JournalIdAndDeletedFalse(UUID ks6JournalId);
}
