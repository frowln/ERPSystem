package com.privod.platform.modules.specification.repository;

import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpecificationRepository extends JpaRepository<Specification, UUID>, JpaSpecificationExecutor<Specification> {

    Page<Specification> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Specification> findByStatusAndDeletedFalse(SpecificationStatus status, Pageable pageable);

    List<Specification> findByProjectIdAndIsCurrentTrueAndDeletedFalse(UUID projectId);

    @Query(value = "SELECT nextval('spec_name_seq')", nativeQuery = true)
    long getNextNameSequence();

    Optional<Specification> findByIdAndDeletedFalse(UUID id);
}
