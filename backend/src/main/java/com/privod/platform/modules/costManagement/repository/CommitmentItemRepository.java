package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.CommitmentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CommitmentItemRepository extends JpaRepository<CommitmentItem, UUID> {

    List<CommitmentItem> findByCommitmentIdAndDeletedFalseOrderBySortOrderAsc(UUID commitmentId);

    @Query("SELECT COALESCE(SUM(ci.totalPrice), 0) FROM CommitmentItem ci " +
            "WHERE ci.commitmentId = :commitmentId AND ci.deleted = false")
    BigDecimal sumTotalPriceByCommitmentId(@Param("commitmentId") UUID commitmentId);

    long countByCommitmentIdAndDeletedFalse(UUID commitmentId);

    void deleteByCommitmentId(UUID commitmentId);
}
