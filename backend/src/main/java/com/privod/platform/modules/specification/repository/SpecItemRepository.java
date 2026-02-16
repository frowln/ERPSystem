package com.privod.platform.modules.specification.repository;

import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.domain.SpecItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface SpecItemRepository extends JpaRepository<SpecItem, UUID> {

    List<SpecItem> findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(UUID specificationId);

    List<SpecItem> findBySpecificationIdAndItemTypeAndDeletedFalseOrderBySequenceAsc(UUID specificationId, SpecItemType itemType);

    long countBySpecificationIdAndDeletedFalse(UUID specificationId);

    @Query("SELECT COALESCE(SUM(si.plannedAmount), 0) FROM SpecItem si WHERE si.specificationId = :specId AND si.deleted = false")
    BigDecimal sumPlannedAmountBySpecificationId(@Param("specId") UUID specificationId);
}
