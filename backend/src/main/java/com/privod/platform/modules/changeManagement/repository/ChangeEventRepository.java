package com.privod.platform.modules.changeManagement.repository;

import com.privod.platform.modules.changeManagement.domain.ChangeEvent;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeEventRepository extends JpaRepository<ChangeEvent, UUID>, JpaSpecificationExecutor<ChangeEvent> {

    Page<ChangeEvent> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<ChangeEvent> findByProjectIdAndOrganizationIdAndDeletedFalse(UUID projectId, UUID organizationId);

    Page<ChangeEvent> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, ChangeEventStatus status, Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    @Query("SELECT COUNT(ce) FROM ChangeEvent ce WHERE ce.projectId = :projectId " +
            "AND ce.status = :status AND ce.deleted = false")
    long countByProjectIdAndStatus(@Param("projectId") UUID projectId,
                                    @Param("status") ChangeEventStatus status);

    @Query("SELECT ce FROM ChangeEvent ce WHERE ce.linkedRfiId = :rfiId AND ce.deleted = false")
    List<ChangeEvent> findByLinkedRfiId(@Param("rfiId") UUID rfiId);

    @Query(value = "SELECT nextval('change_event_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
