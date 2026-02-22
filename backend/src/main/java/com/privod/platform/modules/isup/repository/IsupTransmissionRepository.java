package com.privod.platform.modules.isup.repository;

import com.privod.platform.modules.isup.domain.IsupTransmission;
import com.privod.platform.modules.isup.domain.IsupTransmissionStatus;
import com.privod.platform.modules.isup.domain.IsupTransmissionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface IsupTransmissionRepository extends JpaRepository<IsupTransmission, UUID> {

    Page<IsupTransmission> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<IsupTransmission> findByOrganizationIdAndStatusAndDeletedFalse(
            UUID organizationId, IsupTransmissionStatus status, Pageable pageable);

    Page<IsupTransmission> findByOrganizationIdAndTransmissionTypeAndDeletedFalse(
            UUID organizationId, IsupTransmissionType type, Pageable pageable);

    Page<IsupTransmission> findByOrganizationIdAndProjectMappingIdAndDeletedFalse(
            UUID organizationId, UUID projectMappingId, Pageable pageable);

    List<IsupTransmission> findByStatusAndRetryCountLessThanAndDeletedFalse(
            IsupTransmissionStatus status, int maxRetries);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, IsupTransmissionStatus status);

    @Query("SELECT COUNT(t) FROM IsupTransmission t WHERE t.organizationId = :orgId " +
            "AND t.status = :status AND t.confirmedAt >= :since AND t.deleted = false")
    long countByOrganizationIdAndStatusAndConfirmedAtAfterAndDeletedFalse(
            @Param("orgId") UUID organizationId,
            @Param("status") IsupTransmissionStatus status,
            @Param("since") Instant since);
}
