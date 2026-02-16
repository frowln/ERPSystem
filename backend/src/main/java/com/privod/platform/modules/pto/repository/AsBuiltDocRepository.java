package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.AsBuiltDoc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsBuiltDocRepository extends JpaRepository<AsBuiltDoc, UUID>, JpaSpecificationExecutor<AsBuiltDoc> {

    Page<AsBuiltDoc> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<AsBuiltDoc> findByProjectIdAndDeletedFalse(UUID projectId);
}
