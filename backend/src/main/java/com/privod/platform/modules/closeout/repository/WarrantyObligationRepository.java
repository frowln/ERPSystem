package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.WarrantyObligation;
import com.privod.platform.modules.closeout.domain.WarrantyObligationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface WarrantyObligationRepository extends JpaRepository<WarrantyObligation, UUID>,
        JpaSpecificationExecutor<WarrantyObligation> {

    Page<WarrantyObligation> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<WarrantyObligation> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);

    List<WarrantyObligation> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId,
                                                                           WarrantyObligationStatus status);

    List<WarrantyObligation> findByOrganizationIdAndWarrantyEndDateBeforeAndStatusAndDeletedFalse(
            UUID organizationId, LocalDate date, WarrantyObligationStatus status);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, WarrantyObligationStatus status);
}
