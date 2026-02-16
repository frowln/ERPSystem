package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {

    List<TicketComment> findByTicketIdAndDeletedFalseOrderByCreatedAtDesc(UUID ticketId);

    List<TicketComment> findByTicketIdAndIsInternalFalseAndDeletedFalseOrderByCreatedAtDesc(UUID ticketId);
}
