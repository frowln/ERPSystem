package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.SupportTicket;
import com.privod.platform.modules.support.domain.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    Optional<SupportTicket> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<SupportTicket> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<SupportTicket> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, TicketStatus status, Pageable pageable);

    Page<SupportTicket> findByOrganizationIdAndAssigneeIdAndDeletedFalse(UUID organizationId, UUID assigneeId, Pageable pageable);

    Page<SupportTicket> findByOrganizationIdAndReporterIdAndDeletedFalse(UUID organizationId, UUID reporterId, Pageable pageable);

    @Query("SELECT t.status, COUNT(t) FROM SupportTicket t " +
            "WHERE t.deleted = false AND t.organizationId = :organizationId GROUP BY t.status")
    List<Object[]> countByStatusAndOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT t.priority, COUNT(t) FROM SupportTicket t " +
            "WHERE t.deleted = false AND t.organizationId = :organizationId GROUP BY t.priority")
    List<Object[]> countByPriorityAndOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.deleted = false AND t.organizationId = :organizationId")
    long countTotalByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.deleted = false " +
            "AND t.organizationId = :organizationId AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOpenByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query(value = "SELECT nextval('support_ticket_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    /**
     * Find tickets that are overdue (dueDate before given date)
     * and not in the excluded statuses (e.g. CLOSED, RESOLVED).
     */
    List<SupportTicket> findByDueDateBeforeAndStatusNotInAndDeletedFalse(
            LocalDate date, List<TicketStatus> excludedStatuses);
}
