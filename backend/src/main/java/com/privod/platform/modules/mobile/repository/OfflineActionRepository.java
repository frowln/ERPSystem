package com.privod.platform.modules.mobile.repository;

import com.privod.platform.modules.mobile.domain.OfflineAction;
import com.privod.platform.modules.mobile.domain.OfflineActionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OfflineActionRepository extends JpaRepository<OfflineAction, UUID> {

    Page<OfflineAction> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    List<OfflineAction> findByUserIdAndStatusAndDeletedFalse(UUID userId, OfflineActionStatus status);

    long countByUserIdAndStatusAndDeletedFalse(UUID userId, OfflineActionStatus status);
}
