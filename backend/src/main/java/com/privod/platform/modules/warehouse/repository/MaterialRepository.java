package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID>,
        JpaSpecificationExecutor<Material> {

    Optional<Material> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<Material> findByDeletedFalseAndActiveTrue(Pageable pageable);

    Page<Material> findByCategoryAndDeletedFalse(MaterialCategory category, Pageable pageable);

    Optional<Material> findByCodeAndDeletedFalse(String code);

    @Query("SELECT m FROM Material m WHERE m.deleted = false AND " +
            "(LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(m.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Material> searchByNameOrCode(@Param("search") String search, Pageable pageable);

    boolean existsByCodeAndDeletedFalse(String code);

    boolean existsByOrganizationIdAndCodeAndDeletedFalse(UUID organizationId, String code);
}
