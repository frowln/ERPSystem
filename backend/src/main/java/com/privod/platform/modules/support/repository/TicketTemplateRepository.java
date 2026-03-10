package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.TicketTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketTemplateRepository extends JpaRepository<TicketTemplate, UUID> {
    List<TicketTemplate> findByIsActiveTrueOrderByNameAsc();
    List<TicketTemplate> findByOrganizationIdAndIsActiveTrueOrderByNameAsc(UUID organizationId);
    List<TicketTemplate> findByCategoryAndIsActiveTrueOrderByNameAsc(String category);
}
