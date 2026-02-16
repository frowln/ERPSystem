package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.DeclarationStatus;
import com.privod.platform.modules.accounting.domain.DeclarationType;
import com.privod.platform.modules.accounting.domain.TaxDeclaration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxDeclarationRepository extends JpaRepository<TaxDeclaration, UUID> {

    Optional<TaxDeclaration> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<TaxDeclaration> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<TaxDeclaration> findByOrganizationIdAndDeclarationTypeAndDeletedFalse(UUID organizationId, DeclarationType type, Pageable pageable);

    Page<TaxDeclaration> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, DeclarationStatus status, Pageable pageable);

    List<TaxDeclaration> findByOrganizationIdAndPeriodIdAndDeletedFalse(UUID organizationId, UUID periodId);
}
