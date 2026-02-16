package com.privod.platform.modules.organization.repository;

import com.privod.platform.modules.organization.domain.EnrichmentSource;
import com.privod.platform.modules.organization.domain.PartnerEnrichment;
import com.privod.platform.modules.organization.domain.PartnerLegalStatus;
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
public interface PartnerEnrichmentRepository extends JpaRepository<PartnerEnrichment, UUID>, JpaSpecificationExecutor<PartnerEnrichment> {

    Optional<PartnerEnrichment> findByPartnerIdAndDeletedFalse(UUID partnerId);

    Optional<PartnerEnrichment> findByInnAndDeletedFalse(String inn);

    Optional<PartnerEnrichment> findByOgrnAndDeletedFalse(String ogrn);

    Page<PartnerEnrichment> findByStatusAndDeletedFalse(PartnerLegalStatus status, Pageable pageable);

    Page<PartnerEnrichment> findBySourceAndDeletedFalse(EnrichmentSource source, Pageable pageable);

    @Query("SELECT e FROM PartnerEnrichment e WHERE e.deleted = false " +
            "AND e.reliabilityScore < :threshold " +
            "ORDER BY e.reliabilityScore ASC")
    List<PartnerEnrichment> findLowReliabilityPartners(@Param("threshold") int threshold);

    @Query("SELECT e FROM PartnerEnrichment e WHERE e.deleted = false " +
            "AND (:status IS NULL OR e.status = :status) " +
            "AND (:source IS NULL OR e.source = :source) " +
            "ORDER BY e.enrichedAt DESC")
    Page<PartnerEnrichment> findByFilters(@Param("status") PartnerLegalStatus status,
                                           @Param("source") EnrichmentSource source,
                                           Pageable pageable);
}
