package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.Ks6Journal;
import com.privod.platform.modules.pto.domain.Ks6JournalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface Ks6JournalRepository extends JpaRepository<Ks6Journal, UUID>,
        JpaSpecificationExecutor<Ks6Journal> {

    Page<Ks6Journal> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Ks6Journal> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, Ks6JournalStatus status, Pageable pageable);

    Page<Ks6Journal> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
