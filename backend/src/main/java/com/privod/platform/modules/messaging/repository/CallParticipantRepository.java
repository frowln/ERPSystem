package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.CallParticipant;
import com.privod.platform.modules.messaging.domain.CallParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CallParticipantRepository extends JpaRepository<CallParticipant, UUID> {

    List<CallParticipant> findByCallSessionIdAndDeletedFalse(UUID callSessionId);

    Optional<CallParticipant> findByCallSessionIdAndUserIdAndDeletedFalse(UUID callSessionId, UUID userId);

    long countByCallSessionIdAndParticipantStatusAndDeletedFalse(
            UUID callSessionId,
            CallParticipantStatus participantStatus
    );
}
