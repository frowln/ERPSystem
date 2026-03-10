package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.QualificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QualificationRecordRepository extends JpaRepository<QualificationRecord, UUID> {

    List<QualificationRecord> findByOrganizationIdAndDeletedFalseOrderByExpiryDateAsc(UUID organizationId);

    List<QualificationRecord> findByOrganizationIdAndQualificationTypeAndDeletedFalseOrderByExpiryDateAsc(
            UUID organizationId, String qualificationType);

    List<QualificationRecord> findByOrganizationIdAndStatusAndDeletedFalseOrderByExpiryDateAsc(
            UUID organizationId, QualificationRecord.QualificationStatus status);

    List<QualificationRecord> findByOrganizationIdAndQualificationTypeAndStatusAndDeletedFalseOrderByExpiryDateAsc(
            UUID organizationId, String qualificationType, QualificationRecord.QualificationStatus status);
}
