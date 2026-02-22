package com.privod.platform.modules.specification.repository;

import com.privod.platform.modules.specification.domain.CompetitiveListEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CompetitiveListEntryRepository extends JpaRepository<CompetitiveListEntry, UUID> {

    List<CompetitiveListEntry> findByCompetitiveListId(UUID competitiveListId);

    List<CompetitiveListEntry> findByCompetitiveListIdAndSpecItemId(UUID competitiveListId, UUID specItemId);

    long countByCompetitiveListIdAndSpecItemId(UUID competitiveListId, UUID specItemId);

    List<CompetitiveListEntry> findByCompetitiveListIdAndIsWinnerTrue(UUID competitiveListId);
}
