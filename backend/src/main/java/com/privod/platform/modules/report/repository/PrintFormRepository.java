package com.privod.platform.modules.report.repository;

import com.privod.platform.modules.report.domain.PrintForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrintFormRepository extends JpaRepository<PrintForm, UUID> {

    Optional<PrintForm> findByCodeAndDeletedFalse(String code);

    List<PrintForm> findByEntityTypeAndIsActiveTrueAndDeletedFalseOrderBySortOrder(String entityType);

    Optional<PrintForm> findByEntityTypeAndIsDefaultTrueAndDeletedFalse(String entityType);
}
