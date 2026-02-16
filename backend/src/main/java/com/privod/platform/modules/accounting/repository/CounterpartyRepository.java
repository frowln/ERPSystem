package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.Counterparty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CounterpartyRepository extends JpaRepository<Counterparty, UUID> {

    Optional<Counterparty> findByOrganizationIdAndInnAndDeletedFalse(UUID organizationId, String inn);

    Optional<Counterparty> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<Counterparty> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<Counterparty> findByOrganizationIdAndSupplierAndDeletedFalse(UUID organizationId, boolean isSupplier);

    List<Counterparty> findByOrganizationIdAndCustomerAndDeletedFalse(UUID organizationId, boolean isCustomer);

    Page<Counterparty> findByOrganizationIdAndNameContainingIgnoreCaseAndDeletedFalse(UUID organizationId, String name, Pageable pageable);

    // Legacy signatures kept for backward compatibility with older service implementations/tests.
    Optional<Counterparty> findByInnAndDeletedFalse(String inn);

    Page<Counterparty> findByDeletedFalse(Pageable pageable);

    Page<Counterparty> findByNameContainingIgnoreCaseAndDeletedFalse(String name, Pageable pageable);
}
