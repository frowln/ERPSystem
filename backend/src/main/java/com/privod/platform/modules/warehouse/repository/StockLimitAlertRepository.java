package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.StockAlertSeverity;
import com.privod.platform.modules.warehouse.domain.StockLimitAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockLimitAlertRepository extends JpaRepository<StockLimitAlert, UUID> {

    Page<StockLimitAlert> findByDeletedFalse(Pageable pageable);

    Page<StockLimitAlert> findByIsResolvedFalseAndDeletedFalse(Pageable pageable);

    List<StockLimitAlert> findByIsResolvedFalseAndDeletedFalse();

    List<StockLimitAlert> findByMaterialIdAndIsResolvedFalseAndDeletedFalse(UUID materialId);

    List<StockLimitAlert> findBySeverityAndIsResolvedFalseAndDeletedFalse(StockAlertSeverity severity);

    List<StockLimitAlert> findByStockLimitIdAndIsResolvedFalseAndDeletedFalse(UUID stockLimitId);
}
