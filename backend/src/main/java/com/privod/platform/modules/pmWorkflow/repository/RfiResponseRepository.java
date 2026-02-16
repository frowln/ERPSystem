package com.privod.platform.modules.pmWorkflow.repository;

import com.privod.platform.modules.pmWorkflow.domain.RfiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RfiResponseRepository extends JpaRepository<RfiResponse, UUID> {

    Page<RfiResponse> findByRfiIdAndDeletedFalse(UUID rfiId, Pageable pageable);

    List<RfiResponse> findByRfiIdAndDeletedFalseOrderByRespondedAtDesc(UUID rfiId);

    @Query("SELECT r FROM RfiResponse r WHERE r.rfiId = :rfiId AND r.isOfficial = true AND r.deleted = false")
    List<RfiResponse> findOfficialResponses(@Param("rfiId") UUID rfiId);

    long countByRfiIdAndDeletedFalse(UUID rfiId);
}
