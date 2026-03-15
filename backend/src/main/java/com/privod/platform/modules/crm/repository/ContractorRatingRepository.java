package com.privod.platform.modules.crm.repository;

import com.privod.platform.modules.crm.domain.ContractorRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractorRatingRepository extends JpaRepository<ContractorRating, UUID> {

    Page<ContractorRating> findByCounterpartyIdAndDeletedFalse(UUID counterpartyId, Pageable pageable);

    List<ContractorRating> findByCounterpartyIdAndDeletedFalse(UUID counterpartyId);

    @Query("SELECT AVG(r.qualityScore) FROM ContractorRating r WHERE r.counterpartyId = :cpId AND r.deleted = false AND r.qualityScore IS NOT NULL")
    Double averageQualityScore(@Param("cpId") UUID counterpartyId);

    @Query("SELECT AVG(r.timelinessScore) FROM ContractorRating r WHERE r.counterpartyId = :cpId AND r.deleted = false AND r.timelinessScore IS NOT NULL")
    Double averageTimelinessScore(@Param("cpId") UUID counterpartyId);

    @Query("SELECT AVG(r.safetyScore) FROM ContractorRating r WHERE r.counterpartyId = :cpId AND r.deleted = false AND r.safetyScore IS NOT NULL")
    Double averageSafetyScore(@Param("cpId") UUID counterpartyId);

    @Query("SELECT AVG(r.communicationScore) FROM ContractorRating r WHERE r.counterpartyId = :cpId AND r.deleted = false AND r.communicationScore IS NOT NULL")
    Double averageCommunicationScore(@Param("cpId") UUID counterpartyId);

    @Query("SELECT AVG(r.priceScore) FROM ContractorRating r WHERE r.counterpartyId = :cpId AND r.deleted = false AND r.priceScore IS NOT NULL")
    Double averagePriceScore(@Param("cpId") UUID counterpartyId);

    long countByCounterpartyIdAndDeletedFalse(UUID counterpartyId);
}
