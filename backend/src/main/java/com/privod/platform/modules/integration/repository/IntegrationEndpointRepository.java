package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.domain.IntegrationEndpoint;
import com.privod.platform.modules.integration.domain.IntegrationProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationEndpointRepository extends JpaRepository<IntegrationEndpoint, UUID>,
        JpaSpecificationExecutor<IntegrationEndpoint> {

    Optional<IntegrationEndpoint> findByCodeAndDeletedFalse(String code);

    List<IntegrationEndpoint> findByProviderAndDeletedFalse(IntegrationProvider provider);

    List<IntegrationEndpoint> findByIsActiveAndDeletedFalse(boolean isActive);

    Page<IntegrationEndpoint> findByDeletedFalse(Pageable pageable);

    List<IntegrationEndpoint> findByHealthStatusAndDeletedFalse(HealthStatus healthStatus);

    @Query("SELECT e FROM IntegrationEndpoint e WHERE e.deleted = false AND e.isActive = true " +
            "AND (LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(e.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<IntegrationEndpoint> searchByNameOrCode(@Param("search") String search, Pageable pageable);

    boolean existsByCodeAndDeletedFalse(String code);
}
