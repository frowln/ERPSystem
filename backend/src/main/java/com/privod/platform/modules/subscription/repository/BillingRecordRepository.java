package com.privod.platform.modules.subscription.repository;

import com.privod.platform.modules.subscription.domain.BillingRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BillingRecordRepository extends JpaRepository<BillingRecord, UUID> {

    Page<BillingRecord> findByOrganizationIdAndDeletedFalseOrderByInvoiceDateDesc(
            UUID organizationId, Pageable pageable);
}
