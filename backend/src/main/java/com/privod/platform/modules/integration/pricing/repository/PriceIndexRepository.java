package com.privod.platform.modules.integration.pricing.repository;

import com.privod.platform.modules.integration.pricing.domain.PriceIndex;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PriceIndexRepository extends JpaRepository<PriceIndex, UUID> {

    Page<PriceIndex> findByDeletedFalse(Pageable pageable);

    List<PriceIndex> findByRegionAndDeletedFalse(String region);

    List<PriceIndex> findByRegionAndWorkTypeAndDeletedFalse(String region, String workType);

    @Query("SELECT i FROM PriceIndex i WHERE i.deleted = false " +
            "AND i.region = :region AND i.workType = :workType " +
            "AND i.targetQuarter = :targetQuarter")
    Optional<PriceIndex> findByRegionAndWorkTypeAndTargetQuarter(
            @Param("region") String region,
            @Param("workType") String workType,
            @Param("targetQuarter") String targetQuarter);

    @Query("SELECT i FROM PriceIndex i WHERE i.deleted = false " +
            "AND (:region IS NULL OR i.region = :region) " +
            "AND (:workType IS NULL OR i.workType = :workType)")
    Page<PriceIndex> findByFilters(@Param("region") String region,
                                    @Param("workType") String workType,
                                    Pageable pageable);

    boolean existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
            String region,
            String workType,
            String baseQuarter,
            String targetQuarter
    );

    @Query("SELECT i FROM PriceIndex i WHERE i.deleted = false AND i.targetQuarter = :targetQuarter")
    List<PriceIndex> findByTargetQuarter(@Param("targetQuarter") String targetQuarter);
}
