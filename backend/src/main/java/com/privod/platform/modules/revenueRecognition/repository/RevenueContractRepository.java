package com.privod.platform.modules.revenueRecognition.repository;

import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
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
public interface RevenueContractRepository extends JpaRepository<RevenueContract, UUID>,
        JpaSpecificationExecutor<RevenueContract> {

    Page<RevenueContract> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<RevenueContract> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<RevenueContract> findByContractIdAndDeletedFalse(UUID contractId);

    Optional<RevenueContract> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    @Query("SELECT rc FROM RevenueContract rc WHERE rc.deleted = false AND rc.isActive = true " +
            "AND rc.organizationId = :organizationId")
    Page<RevenueContract> findActiveByOrganization(@Param("organizationId") UUID organizationId,
                                                    Pageable pageable);

    @Query("SELECT COUNT(rc) FROM RevenueContract rc WHERE rc.deleted = false " +
            "AND rc.organizationId = :organizationId AND rc.isActive = true")
    long countActiveByOrganization(@Param("organizationId") UUID organizationId);

    @Query("SELECT rc FROM RevenueContract rc WHERE rc.deleted = false " +
            "AND (:projectId IS NULL OR rc.projectId = :projectId) " +
            "AND (:organizationId IS NULL OR rc.organizationId = :organizationId) " +
            "AND rc.isActive = true")
    Page<RevenueContract> findByFilters(@Param("projectId") UUID projectId,
                                         @Param("organizationId") UUID organizationId,
                                         Pageable pageable);
}
