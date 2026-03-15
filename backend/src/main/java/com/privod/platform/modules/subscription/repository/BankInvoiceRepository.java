package com.privod.platform.modules.subscription.repository;

import com.privod.platform.modules.subscription.domain.BankInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BankInvoiceRepository extends JpaRepository<BankInvoice, UUID> {

    List<BankInvoice> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(UUID organizationId);
}
