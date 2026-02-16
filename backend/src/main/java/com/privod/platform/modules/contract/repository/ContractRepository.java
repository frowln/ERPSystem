package com.privod.platform.modules.contract.repository;

import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID>, JpaSpecificationExecutor<Contract> {

    Optional<Contract> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Optional<Contract> findByOrganizationIdAndNumberAndDeletedFalse(UUID organizationId, String number);

    Page<Contract> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    Page<Contract> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, ContractStatus status, Pageable pageable);

    Page<Contract> findByOrganizationIdAndPartnerIdAndDeletedFalse(UUID organizationId, UUID partnerId, Pageable pageable);

    Page<Contract> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Contract> findByStatusAndDeletedFalse(ContractStatus status, Pageable pageable);

    Page<Contract> findByPartnerIdAndDeletedFalse(UUID partnerId, Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Contract c " +
            "WHERE c.projectId = :projectId AND c.status IN :statuses AND c.deleted = false")
    BigDecimal sumAmountByProjectIdAndStatusIn(@Param("projectId") UUID projectId,
                                               @Param("statuses") List<ContractStatus> statuses);

    @Query("SELECT c FROM Contract c WHERE c.deleted = false AND " +
            "(LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.number) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Contract> searchByNameOrNumber(@Param("search") String search, Pageable pageable);

    @Query("SELECT c.status, COUNT(c) FROM Contract c WHERE c.deleted = false AND " +
            "(:projectId IS NULL OR c.projectId = :projectId) GROUP BY c.status")
    List<Object[]> countByStatusAndProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT c.status, COUNT(c) FROM Contract c WHERE c.deleted = false AND c.organizationId = :organizationId AND " +
            "(:projectId IS NULL OR c.projectId = :projectId) GROUP BY c.status")
    List<Object[]> countByStatusAndProjectIdAndOrganizationId(@Param("projectId") UUID projectId,
                                                               @Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(c) FROM Contract c WHERE c.deleted = false AND " +
            "(:projectId IS NULL OR c.projectId = :projectId)")
    long countActiveContracts(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(c) FROM Contract c WHERE c.deleted = false AND c.organizationId = :organizationId AND " +
            "(:projectId IS NULL OR c.projectId = :projectId)")
    long countActiveContractsByOrganizationId(@Param("projectId") UUID projectId,
                                              @Param("organizationId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Contract c WHERE c.deleted = false AND " +
            "c.status <> 'CANCELLED' AND (:projectId IS NULL OR c.projectId = :projectId)")
    BigDecimal sumTotalAmount(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Contract c WHERE c.deleted = false AND c.organizationId = :organizationId AND " +
            "c.status <> 'CANCELLED' AND (:projectId IS NULL OR c.projectId = :projectId)")
    BigDecimal sumTotalAmountByOrganizationId(@Param("projectId") UUID projectId,
                                              @Param("organizationId") UUID organizationId);

    /**
     * Sum contract amounts for a project filtered by contract type codes.
     * Only includes non-deleted, non-cancelled contracts.
     * Uses native SQL because Contract.typeId has no JPA relationship mapping.
     */
    @Query(value = "SELECT COALESCE(SUM(c.amount), 0) FROM contracts c " +
            "JOIN contract_types ct ON c.type_id = ct.id " +
            "WHERE c.project_id = :projectId AND ct.code IN :typeCodes " +
            "AND c.status <> 'CANCELLED' AND c.deleted = false", nativeQuery = true)
    BigDecimal sumAmountByProjectIdAndTypeCodes(@Param("projectId") UUID projectId,
                                                 @Param("typeCodes") List<String> typeCodes);

    @Query(value = "SELECT COALESCE(SUM(c.amount), 0) FROM contracts c " +
            "JOIN contract_types ct ON c.type_id = ct.id " +
            "WHERE c.organization_id = :organizationId AND c.project_id = :projectId AND ct.code IN :typeCodes " +
            "AND c.status <> 'CANCELLED' AND c.deleted = false", nativeQuery = true)
    BigDecimal sumAmountByProjectIdAndTypeCodesAndOrganizationId(@Param("projectId") UUID projectId,
                                                                  @Param("typeCodes") List<String> typeCodes,
                                                                  @Param("organizationId") UUID organizationId);

    /**
     * Sum totalWithVat for a project filtered by contract type codes.
     * Only includes non-deleted, non-cancelled contracts.
     * Uses native SQL because Contract.typeId has no JPA relationship mapping.
     */
    @Query(value = "SELECT COALESCE(SUM(c.total_with_vat), 0) FROM contracts c " +
            "JOIN contract_types ct ON c.type_id = ct.id " +
            "WHERE c.project_id = :projectId AND ct.code IN :typeCodes " +
            "AND c.status <> 'CANCELLED' AND c.deleted = false", nativeQuery = true)
    BigDecimal sumTotalWithVatByProjectIdAndTypeCodes(@Param("projectId") UUID projectId,
                                                       @Param("typeCodes") List<String> typeCodes);

    @Query(value = "SELECT COALESCE(SUM(c.total_with_vat), 0) FROM contracts c " +
            "JOIN contract_types ct ON c.type_id = ct.id " +
            "WHERE c.organization_id = :organizationId AND c.project_id = :projectId AND ct.code IN :typeCodes " +
            "AND c.status <> 'CANCELLED' AND c.deleted = false", nativeQuery = true)
    BigDecimal sumTotalWithVatByProjectIdAndTypeCodesAndOrganizationId(@Param("projectId") UUID projectId,
                                                                        @Param("typeCodes") List<String> typeCodes,
                                                                        @Param("organizationId") UUID organizationId);

    @Query(value = "SELECT nextval('contract_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
