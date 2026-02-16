package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.MappingDirection;
import com.privod.platform.modules.integration.domain.SyncMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SyncMappingRepository extends JpaRepository<SyncMapping, UUID> {

    List<SyncMapping> findByEndpointIdAndDeletedFalse(UUID endpointId);

    List<SyncMapping> findByEndpointIdAndLocalEntityTypeAndDeletedFalse(UUID endpointId, String localEntityType);

    List<SyncMapping> findByEndpointIdAndRemoteEntityTypeAndDeletedFalse(UUID endpointId, String remoteEntityType);

    List<SyncMapping> findByEndpointIdAndDirectionAndDeletedFalse(UUID endpointId, MappingDirection direction);

    Page<SyncMapping> findByDeletedFalse(Pageable pageable);

    Page<SyncMapping> findByEndpointIdAndDeletedFalse(UUID endpointId, Pageable pageable);
}
