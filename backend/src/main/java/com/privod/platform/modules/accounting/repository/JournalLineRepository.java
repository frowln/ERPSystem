package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, UUID> {

    List<JournalLine> findByEntryIdAndDeletedFalseOrderByCreatedAtAsc(UUID entryId);

    List<JournalLine> findByAccountIdAndDeletedFalse(UUID accountId);
}
