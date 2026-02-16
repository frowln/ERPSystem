package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.SyncDirection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OneCConfigRepository extends JpaRepository<OneCConfig, UUID> {

    Page<OneCConfig> findByDeletedFalse(Pageable pageable);

    List<OneCConfig> findByIsActiveAndDeletedFalse(boolean isActive);

    List<OneCConfig> findBySyncDirectionAndDeletedFalse(SyncDirection syncDirection);

    Optional<OneCConfig> findByNameAndDeletedFalse(String name);

    boolean existsByNameAndDeletedFalse(String name);
}
