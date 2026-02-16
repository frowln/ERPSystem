package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.SupplierRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRatingRepository extends JpaRepository<SupplierRating, UUID> {

    List<SupplierRating> findBySupplierIdAndDeletedFalseOrderByPeriodIdDesc(UUID supplierId);

    Optional<SupplierRating> findBySupplierIdAndPeriodIdAndDeletedFalse(UUID supplierId, String periodId);
}
