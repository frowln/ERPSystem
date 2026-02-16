package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.OneCExchangeLog;
import com.privod.platform.modules.integration.domain.OneCExchangeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OneCExchangeLogRepository extends JpaRepository<OneCExchangeLog, UUID> {

    Page<OneCExchangeLog> findByConfigIdAndDeletedFalse(UUID configId, Pageable pageable);

    List<OneCExchangeLog> findByStatusAndDeletedFalse(OneCExchangeStatus status);

    Page<OneCExchangeLog> findByDeletedFalse(Pageable pageable);
}
