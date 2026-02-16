package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.ActOsvidetelstvovanie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActOsvidetelstvovanieRepository extends JpaRepository<ActOsvidetelstvovanie, UUID>,
        JpaSpecificationExecutor<ActOsvidetelstvovanie> {

    Page<ActOsvidetelstvovanie> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<ActOsvidetelstvovanie> findByProjectIdAndDeletedFalse(UUID projectId);
}
