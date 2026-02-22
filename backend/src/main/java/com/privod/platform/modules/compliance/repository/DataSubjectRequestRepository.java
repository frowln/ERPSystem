package com.privod.platform.modules.compliance.repository;

import com.privod.platform.modules.compliance.domain.DataSubjectRequest;
import com.privod.platform.modules.compliance.domain.SubjectRequestStatus;
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
public interface DataSubjectRequestRepository extends JpaRepository<DataSubjectRequest, UUID> {

    Page<DataSubjectRequest> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<DataSubjectRequest> findByOrganizationIdAndStatusAndDeletedFalse(
            UUID organizationId, SubjectRequestStatus status, Pageable pageable);

    List<DataSubjectRequest> findByOrganizationIdAndUserIdAndDeletedFalse(UUID organizationId, UUID userId);

    @Query("SELECT dsr FROM DataSubjectRequest dsr WHERE dsr.organizationId = :orgId " +
            "AND dsr.deadlineAt < :now AND dsr.status <> 'COMPLETED' AND dsr.status <> 'REJECTED' " +
            "AND dsr.deleted = false")
    List<DataSubjectRequest> findOverdue(@Param("orgId") UUID organizationId, @Param("now") Instant now);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, SubjectRequestStatus status);
}
