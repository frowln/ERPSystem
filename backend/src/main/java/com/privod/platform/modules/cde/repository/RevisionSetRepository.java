package com.privod.platform.modules.cde.repository;

import com.privod.platform.modules.cde.domain.RevisionSet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RevisionSetRepository extends JpaRepository<RevisionSet, UUID> {

    Page<RevisionSet> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);
}
