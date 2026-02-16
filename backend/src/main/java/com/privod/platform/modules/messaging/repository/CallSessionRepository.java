package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.CallSession;
import com.privod.platform.modules.messaging.domain.CallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CallSessionRepository extends JpaRepository<CallSession, UUID> {

    Optional<CallSession> findByIdAndDeletedFalse(UUID id);

    List<CallSession> findTop100ByDeletedFalseOrderByCreatedAtDesc();

    List<CallSession> findTop100ByProjectIdAndDeletedFalseOrderByCreatedAtDesc(UUID projectId);

    List<CallSession> findTop100ByChannelIdAndDeletedFalseOrderByCreatedAtDesc(UUID channelId);

    List<CallSession> findByStatusAndDeletedFalse(CallStatus status);
}
