package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.SlaViolation;
import com.privod.platform.modules.contractExt.domain.ViolationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SlaViolationRepository extends JpaRepository<SlaViolation, UUID> {

    Page<SlaViolation> findBySlaIdAndDeletedFalse(UUID slaId, Pageable pageable);

    List<SlaViolation> findBySlaIdAndDeletedFalseOrderByViolationDateDesc(UUID slaId);

    long countBySlaIdAndStatusAndDeletedFalse(UUID slaId, ViolationStatus status);
}
