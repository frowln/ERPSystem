package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.SzvTd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SzvTdRepository extends JpaRepository<SzvTd, UUID> {

    List<SzvTd> findByEmployeeIdAndDeletedFalseOrderByReportDateDesc(UUID employeeId);

    List<SzvTd> findByDeletedFalse();
}
