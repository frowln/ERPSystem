package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.WarehouseLocation;
import com.privod.platform.modules.warehouse.domain.WarehouseLocationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocation, UUID>,
        JpaSpecificationExecutor<WarehouseLocation> {

    Page<WarehouseLocation> findByDeletedFalseAndActiveTrue(Pageable pageable);

    Page<WarehouseLocation> findByLocationTypeAndDeletedFalse(WarehouseLocationType locationType, Pageable pageable);

    List<WarehouseLocation> findByParentIdAndDeletedFalse(UUID parentId);

    List<WarehouseLocation> findByProjectIdAndDeletedFalse(UUID projectId);

    @Query("SELECT l FROM WarehouseLocation l WHERE l.deleted = false AND " +
            "(LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<WarehouseLocation> searchByNameOrCode(@Param("search") String search, Pageable pageable);

    boolean existsByCodeAndDeletedFalse(String code);
}
