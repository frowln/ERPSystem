package com.privod.platform.modules.contract.repository;

import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.domain.ContractBudgetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ContractBudgetItemRepository extends JpaRepository<ContractBudgetItem, UUID> {
    List<ContractBudgetItem> findByContractId(UUID contractId);
    List<ContractBudgetItem> findByBudgetItemId(UUID budgetItemId);
    boolean existsByContractIdAndBudgetItemId(UUID contractId, UUID budgetItemId);

    @Query("SELECT DISTINCT cbi.budgetItemId FROM ContractBudgetItem cbi WHERE cbi.contractId = :contractId")
    List<UUID> findDistinctBudgetItemIdsByContractId(@Param("contractId") UUID contractId);

    @Query("SELECT COALESCE(SUM(cbi.allocatedQuantity), 0) FROM ContractBudgetItem cbi WHERE cbi.budgetItemId = :budgetItemId")
    BigDecimal sumAllocatedQuantityByBudgetItemId(@Param("budgetItemId") UUID budgetItemId);

    @Query("SELECT COALESCE(SUM(cbi.allocatedAmount), 0) FROM ContractBudgetItem cbi WHERE cbi.budgetItemId = :budgetItemId")
    BigDecimal sumAllocatedAmountByBudgetItemId(@Param("budgetItemId") UUID budgetItemId);

    @Query("SELECT COALESCE(SUM(cbi.allocatedAmount), 0) FROM ContractBudgetItem cbi " +
            "JOIN Contract c ON c.id = cbi.contractId " +
            "WHERE cbi.budgetItemId = :budgetItemId AND c.status IN :statuses AND c.deleted = false")
    BigDecimal sumAllocatedAmountByBudgetItemIdAndContractStatusIn(@Param("budgetItemId") UUID budgetItemId,
                                                                   @Param("statuses") List<ContractStatus> statuses);

    @Query("SELECT COALESCE(SUM(cbi.allocatedAmount), 0) FROM ContractBudgetItem cbi " +
            "WHERE cbi.budgetItemId = :budgetItemId AND cbi.id <> :linkId")
    BigDecimal sumAllocatedAmountByBudgetItemIdExcludingLinkId(@Param("budgetItemId") UUID budgetItemId,
                                                                @Param("linkId") UUID linkId);

    @Query("SELECT COALESCE(SUM(cbi.allocatedQuantity), 0) FROM ContractBudgetItem cbi " +
            "WHERE cbi.budgetItemId = :budgetItemId AND cbi.id <> :linkId")
    BigDecimal sumAllocatedQuantityByBudgetItemIdExcludingLinkId(@Param("budgetItemId") UUID budgetItemId,
                                                                  @Param("linkId") UUID linkId);

    @Query(value = "SELECT COALESCE(SUM(k.total_with_vat), 0) FROM ks2_documents k " +
            "JOIN contract_budget_items cbi ON cbi.contract_id = k.contract_id " +
            "JOIN contracts c ON c.id = k.contract_id " +
            "WHERE cbi.budget_item_id = :budgetItemId AND k.status = 'SIGNED' " +
            "AND k.deleted = false AND c.deleted = false", nativeQuery = true)
    BigDecimal sumSignedKs2TotalWithVatByBudgetItemId(@Param("budgetItemId") UUID budgetItemId);

    @Query(value = "SELECT DISTINCT ON (cbi.budget_item_id) c.id, cbi.budget_item_id, c.name, c.number, " +
            "c.status, c.partner_name FROM contract_budget_items cbi " +
            "JOIN contracts c ON c.id = cbi.contract_id " +
            "WHERE cbi.budget_item_id IN :budgetItemIds AND c.deleted = false " +
            "ORDER BY cbi.budget_item_id, c.created_at ASC", nativeQuery = true)
    List<Object[]> findFirstContractPerBudgetItem(@Param("budgetItemIds") List<UUID> budgetItemIds);

    void deleteByContractId(UUID contractId);
}
