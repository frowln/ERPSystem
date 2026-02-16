package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.SbisPartnerMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SbisPartnerMappingRepository extends JpaRepository<SbisPartnerMapping, UUID> {

    Page<SbisPartnerMapping> findByDeletedFalse(Pageable pageable);

    Optional<SbisPartnerMapping> findByPartnerIdAndDeletedFalse(UUID partnerId);

    Optional<SbisPartnerMapping> findBySbisContractorInnAndDeletedFalse(String sbisContractorInn);

    List<SbisPartnerMapping> findByIsActiveAndDeletedFalse(boolean isActive);
}
