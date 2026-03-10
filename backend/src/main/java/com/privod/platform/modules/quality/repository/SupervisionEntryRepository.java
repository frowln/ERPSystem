package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.SupervisionEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SupervisionEntryRepository extends JpaRepository<SupervisionEntry, UUID> {

    Page<SupervisionEntry> findByDeletedFalse(Pageable pageable);

    Page<SupervisionEntry> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query(value = "SELECT nextval('supervision_entry_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
