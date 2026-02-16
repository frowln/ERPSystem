package com.privod.platform.modules.journal.repository;

import com.privod.platform.modules.journal.domain.GeneralJournal;
import com.privod.platform.modules.journal.domain.JournalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GeneralJournalRepository extends JpaRepository<GeneralJournal, UUID>,
        JpaSpecificationExecutor<GeneralJournal> {

    Page<GeneralJournal> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<GeneralJournal> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, JournalStatus status, Pageable pageable);

    Page<GeneralJournal> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
