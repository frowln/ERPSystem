package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimElementMetadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BimElementMetadataRepository extends JpaRepository<BimElementMetadata, UUID> {

    Page<BimElementMetadata> findByModelIdAndDeletedFalse(UUID modelId, Pageable pageable);

    Optional<BimElementMetadata> findByModelIdAndElementGuidAndDeletedFalse(UUID modelId, String elementGuid);

    List<BimElementMetadata> findByModelIdAndDeletedFalse(UUID modelId);

    List<BimElementMetadata> findByModelIdAndIfcTypeAndDeletedFalse(UUID modelId, String ifcType);

    List<BimElementMetadata> findByModelIdAndFloorNameAndDeletedFalse(UUID modelId, String floorName);

    long countByModelIdAndDeletedFalse(UUID modelId);

    @Query("SELECT DISTINCT m.floorName FROM BimElementMetadata m " +
            "WHERE m.modelId = :modelId AND m.deleted = false AND m.floorName IS NOT NULL")
    List<String> findDistinctFloorsByModelId(@Param("modelId") UUID modelId);

    @Query("SELECT DISTINCT m.ifcType FROM BimElementMetadata m " +
            "WHERE m.modelId = :modelId AND m.deleted = false AND m.ifcType IS NOT NULL")
    List<String> findDistinctIfcTypesByModelId(@Param("modelId") UUID modelId);
}
