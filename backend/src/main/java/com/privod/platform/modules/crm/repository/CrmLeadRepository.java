package com.privod.platform.modules.crm.repository;

import com.privod.platform.modules.crm.domain.CrmLead;
import com.privod.platform.modules.crm.domain.LeadStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadRepository extends JpaRepository<CrmLead, UUID>,
        JpaSpecificationExecutor<CrmLead> {

    Page<CrmLead> findByStatusAndDeletedFalse(LeadStatus status, Pageable pageable);

    Page<CrmLead> findByStageIdAndDeletedFalse(UUID stageId, Pageable pageable);

    Page<CrmLead> findByAssignedToIdAndDeletedFalse(UUID assignedToId, Pageable pageable);

    @Query("SELECT l FROM CrmLead l WHERE l.deleted = false AND " +
            "(LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.partnerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.companyName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<CrmLead> search(@Param("search") String search, Pageable pageable);

    long countByStatusAndDeletedFalse(LeadStatus status);

    @Query("SELECT l.status, COUNT(l) FROM CrmLead l WHERE l.deleted = false GROUP BY l.status")
    List<Object[]> countByStatus();

    @Query("SELECT l.stageId, COUNT(l) FROM CrmLead l WHERE l.deleted = false AND " +
            "l.status NOT IN ('WON', 'LOST') GROUP BY l.stageId")
    List<Object[]> countByStage();

    @Query("SELECT COALESCE(SUM(l.expectedRevenue), 0) FROM CrmLead l WHERE l.deleted = false " +
            "AND l.status NOT IN ('WON', 'LOST')")
    BigDecimal sumPipelineRevenue();

    @Query("SELECT COALESCE(SUM(l.expectedRevenue * l.probability / 100.0), 0) FROM CrmLead l " +
            "WHERE l.deleted = false AND l.status NOT IN ('WON', 'LOST')")
    BigDecimal sumWeightedPipelineRevenue();

    @Query("SELECT COALESCE(SUM(l.expectedRevenue), 0) FROM CrmLead l WHERE l.deleted = false " +
            "AND l.status = 'WON'")
    BigDecimal sumWonRevenue();

    long countByAssignedToIdAndStatusAndDeletedFalse(UUID assignedToId, LeadStatus status);
}
