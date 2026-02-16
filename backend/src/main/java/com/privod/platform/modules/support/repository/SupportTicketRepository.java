package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.SupportTicket;
import com.privod.platform.modules.support.domain.TicketPriority;
import com.privod.platform.modules.support.domain.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    Page<SupportTicket> findByStatusAndDeletedFalse(TicketStatus status, Pageable pageable);

    Page<SupportTicket> findByAssigneeIdAndDeletedFalse(UUID assigneeId, Pageable pageable);

    Page<SupportTicket> findByReporterIdAndDeletedFalse(UUID reporterId, Pageable pageable);

    @Query("SELECT t.status, COUNT(t) FROM SupportTicket t " +
            "WHERE t.deleted = false GROUP BY t.status")
    List<Object[]> countByStatus();

    @Query("SELECT t.priority, COUNT(t) FROM SupportTicket t " +
            "WHERE t.deleted = false GROUP BY t.priority")
    List<Object[]> countByPriority();

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.deleted = false")
    long countTotal();

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.deleted = false " +
            "AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOpen();

    @Query(value = "SELECT nextval('support_ticket_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
