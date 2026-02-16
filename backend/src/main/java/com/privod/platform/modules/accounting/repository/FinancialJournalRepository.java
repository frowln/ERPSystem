package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.FinancialJournal;
import com.privod.platform.modules.accounting.domain.JournalType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinancialJournalRepository extends JpaRepository<FinancialJournal, UUID> {

    Optional<FinancialJournal> findByOrganizationIdAndCodeAndDeletedFalse(UUID organizationId, String code);

    Optional<FinancialJournal> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<FinancialJournal> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<FinancialJournal> findByOrganizationIdAndJournalTypeAndDeletedFalse(UUID organizationId, JournalType journalType);

    List<FinancialJournal> findByOrganizationIdAndActiveAndDeletedFalse(UUID organizationId, boolean isActive);
}
