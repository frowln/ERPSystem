package com.privod.platform.modules.journal.repository;

import com.privod.platform.modules.journal.domain.GeneralJournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface GeneralJournalEntryRepository extends JpaRepository<GeneralJournalEntry, UUID> {

    Page<GeneralJournalEntry> findByJournalIdAndDeletedFalse(UUID journalId, Pageable pageable);

    List<GeneralJournalEntry> findByJournalIdAndDeletedFalseOrderByDateDesc(UUID journalId);

    List<GeneralJournalEntry> findByJournalIdAndDateBetweenAndDeletedFalse(UUID journalId, LocalDate from, LocalDate to);

    long countByJournalIdAndDeletedFalse(UUID journalId);
}
