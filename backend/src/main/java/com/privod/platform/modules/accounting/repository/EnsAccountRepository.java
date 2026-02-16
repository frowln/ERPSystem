package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.EnsAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnsAccountRepository extends JpaRepository<EnsAccount, UUID> {

    Optional<EnsAccount> findByInnAndDeletedFalse(String inn);

    Page<EnsAccount> findByDeletedFalse(Pageable pageable);

    // --- Tenant-scoped variants ---

    Page<EnsAccount> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Optional<EnsAccount> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);
}
