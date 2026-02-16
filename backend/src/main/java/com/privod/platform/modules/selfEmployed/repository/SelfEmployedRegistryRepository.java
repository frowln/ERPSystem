package com.privod.platform.modules.selfEmployed.repository;

import com.privod.platform.modules.selfEmployed.domain.RegistryStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedRegistry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SelfEmployedRegistryRepository extends JpaRepository<SelfEmployedRegistry, UUID> {

    Page<SelfEmployedRegistry> findByDeletedFalse(Pageable pageable);

    Page<SelfEmployedRegistry> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<SelfEmployedRegistry> findByStatusAndDeletedFalse(RegistryStatus status, Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
