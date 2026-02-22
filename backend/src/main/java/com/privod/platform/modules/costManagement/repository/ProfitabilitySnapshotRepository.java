package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.ProfitabilitySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProfitabilitySnapshotRepository extends JpaRepository<ProfitabilitySnapshot, UUID> {

    List<ProfitabilitySnapshot> findByOrganizationIdAndProjectIdAndDeletedFalseOrderBySnapshotDateAsc(
            UUID organizationId, UUID projectId);

    List<ProfitabilitySnapshot> findByOrganizationIdAndProjectIdAndSnapshotDateBetweenAndDeletedFalse(
            UUID organizationId, UUID projectId, LocalDate from, LocalDate to);
}
