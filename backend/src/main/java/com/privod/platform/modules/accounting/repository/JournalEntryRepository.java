package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.JournalEntry;
import com.privod.platform.modules.accounting.domain.JournalEntryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    Optional<JournalEntry> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<JournalEntry> findByOrganizationIdAndJournalIdAndDeletedFalse(UUID organizationId, UUID journalId, Pageable pageable);

    Page<JournalEntry> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, JournalEntryStatus status, Pageable pageable);

    Page<JournalEntry> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    @Query(value = "SELECT nextval('journal_entry_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    long countByOrganizationIdAndJournalIdAndDeletedFalse(UUID organizationId, UUID journalId);
}
