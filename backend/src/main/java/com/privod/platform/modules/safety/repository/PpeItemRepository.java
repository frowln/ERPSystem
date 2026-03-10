package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.PpeItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PpeItemRepository extends JpaRepository<PpeItem, UUID>,
        JpaSpecificationExecutor<PpeItem> {

    Optional<PpeItem> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<PpeItem> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);
}
