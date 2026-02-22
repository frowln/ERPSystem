package com.privod.platform.modules.isup.repository;

import com.privod.platform.modules.isup.domain.IsupVerificationRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IsupVerificationRecordRepository extends JpaRepository<IsupVerificationRecord, UUID> {

    Page<IsupVerificationRecord> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<IsupVerificationRecord> findByTransmissionIdAndDeletedFalse(UUID transmissionId);

    Page<IsupVerificationRecord> findByOrganizationIdAndTransmissionIdAndDeletedFalse(
            UUID organizationId, UUID transmissionId, Pageable pageable);
}
