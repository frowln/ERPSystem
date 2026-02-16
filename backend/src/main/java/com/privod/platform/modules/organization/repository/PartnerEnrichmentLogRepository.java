package com.privod.platform.modules.organization.repository;

import com.privod.platform.modules.organization.domain.PartnerEnrichmentLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PartnerEnrichmentLogRepository extends JpaRepository<PartnerEnrichmentLog, UUID> {

    Page<PartnerEnrichmentLog> findByPartnerIdAndDeletedFalseOrderByRequestedAtDesc(
            UUID partnerId, Pageable pageable);

    List<PartnerEnrichmentLog> findByPartnerIdAndDeletedFalse(UUID partnerId);
}
