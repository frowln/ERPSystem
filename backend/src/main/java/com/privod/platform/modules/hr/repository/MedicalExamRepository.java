package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.MedicalExam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicalExamRepository extends JpaRepository<MedicalExam, UUID> {

    Page<MedicalExam> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<MedicalExam> findByOrganizationIdAndEmployeeIdAndDeletedFalse(
            UUID organizationId, UUID employeeId, Pageable pageable);

    List<MedicalExam> findByOrganizationIdAndEmployeeIdAndDeletedFalse(
            UUID organizationId, UUID employeeId);

    Optional<MedicalExam> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
