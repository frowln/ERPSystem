package com.privod.platform.modules.integration.pricing.repository;

import com.privod.platform.modules.integration.pricing.domain.PricingDatabase;
import com.privod.platform.modules.integration.pricing.domain.PricingDatabaseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PricingDatabaseRepository extends JpaRepository<PricingDatabase, UUID>,
        JpaSpecificationExecutor<PricingDatabase> {

    Page<PricingDatabase> findByDeletedFalse(Pageable pageable);

    List<PricingDatabase> findByTypeAndDeletedFalse(PricingDatabaseType type);

    List<PricingDatabase> findByRegionAndDeletedFalse(String region);

    List<PricingDatabase> findByActiveAndDeletedFalse(boolean active);

    boolean existsByNameAndDeletedFalse(String name);
}
