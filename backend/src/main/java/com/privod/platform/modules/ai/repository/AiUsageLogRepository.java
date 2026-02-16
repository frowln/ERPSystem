package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiUsageLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, UUID> {

    Page<AiUsageLog> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(u.tokensInput + u.tokensOutput), 0) FROM AiUsageLog u " +
            "WHERE u.userId = :userId AND u.createdAt >= :since AND u.deleted = false")
    long sumTokensByUserSince(@Param("userId") UUID userId, @Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(u.cost), 0.0) FROM AiUsageLog u " +
            "WHERE u.userId = :userId AND u.createdAt >= :since AND u.deleted = false")
    double sumCostByUserSince(@Param("userId") UUID userId, @Param("since") Instant since);
}
