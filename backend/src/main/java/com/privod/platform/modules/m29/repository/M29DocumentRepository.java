package com.privod.platform.modules.m29.repository;

import com.privod.platform.modules.m29.domain.M29Document;
import com.privod.platform.modules.m29.domain.M29Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface M29DocumentRepository extends JpaRepository<M29Document, UUID>, JpaSpecificationExecutor<M29Document> {

    Page<M29Document> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<M29Document> findByStatusAndDeletedFalse(M29Status status, Pageable pageable);

    @Query(value = "SELECT nextval('m29_name_seq')", nativeQuery = true)
    long getNextNameSequence();
}
