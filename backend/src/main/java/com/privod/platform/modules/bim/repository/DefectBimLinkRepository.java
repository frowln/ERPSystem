package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.DefectBimLink;
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
public interface DefectBimLinkRepository extends JpaRepository<DefectBimLink, UUID>,
        JpaSpecificationExecutor<DefectBimLink> {

    List<DefectBimLink> findByDefectIdAndDeletedFalse(UUID defectId);

    Page<DefectBimLink> findByModelIdAndDeletedFalse(UUID modelId, Pageable pageable);

    @Query("SELECT l FROM DefectBimLink l WHERE l.modelId = :modelId AND l.deleted = false " +
           "AND (:floorName IS NULL OR l.floorName = :floorName) " +
           "AND (:systemName IS NULL OR l.systemName = :systemName) " +
           "AND (:elementType IS NULL OR l.elementType = :elementType)")
    Page<DefectBimLink> findByModelIdWithFilters(
            @Param("modelId") UUID modelId,
            @Param("floorName") String floorName,
            @Param("systemName") String systemName,
            @Param("elementType") String elementType,
            Pageable pageable);

    @Query("SELECT l FROM DefectBimLink l JOIN com.privod.platform.modules.bim.domain.BimModel m " +
           "ON l.modelId = m.id WHERE m.projectId = :projectId AND l.deleted = false " +
           "AND (:floorName IS NULL OR l.floorName = :floorName) " +
           "AND (:systemName IS NULL OR l.systemName = :systemName) " +
           "AND (:elementType IS NULL OR l.elementType = :elementType)")
    Page<DefectBimLink> findByProjectIdWithFilters(
            @Param("projectId") UUID projectId,
            @Param("floorName") String floorName,
            @Param("systemName") String systemName,
            @Param("elementType") String elementType,
            Pageable pageable);

    @Query("SELECT l FROM DefectBimLink l JOIN com.privod.platform.modules.bim.domain.BimModel m " +
           "ON l.modelId = m.id WHERE m.projectId = :projectId AND l.floorName = :floorName " +
           "AND l.deleted = false")
    List<DefectBimLink> findByProjectIdAndFloorName(
            @Param("projectId") UUID projectId,
            @Param("floorName") String floorName);

    @Query("SELECT l FROM DefectBimLink l JOIN com.privod.platform.modules.bim.domain.BimModel m " +
           "ON l.modelId = m.id WHERE m.projectId = :projectId AND l.systemName = :systemName " +
           "AND l.deleted = false")
    List<DefectBimLink> findByProjectIdAndSystemName(
            @Param("projectId") UUID projectId,
            @Param("systemName") String systemName);

    @Query("SELECT l.floorName AS floorName, COUNT(l) AS cnt FROM DefectBimLink l " +
           "JOIN com.privod.platform.modules.bim.domain.BimModel m ON l.modelId = m.id " +
           "WHERE m.projectId = :projectId AND l.deleted = false AND l.floorName IS NOT NULL " +
           "GROUP BY l.floorName ORDER BY COUNT(l) DESC")
    List<Object[]> countByFloorForProject(@Param("projectId") UUID projectId);

    @Query("SELECT l.systemName AS systemName, COUNT(l) AS cnt FROM DefectBimLink l " +
           "JOIN com.privod.platform.modules.bim.domain.BimModel m ON l.modelId = m.id " +
           "WHERE m.projectId = :projectId AND l.deleted = false AND l.systemName IS NOT NULL " +
           "GROUP BY l.systemName ORDER BY COUNT(l) DESC")
    List<Object[]> countBySystemForProject(@Param("projectId") UUID projectId);

    @Query("SELECT l.elementType AS elementType, COUNT(l) AS cnt FROM DefectBimLink l " +
           "JOIN com.privod.platform.modules.bim.domain.BimModel m ON l.modelId = m.id " +
           "WHERE m.projectId = :projectId AND l.deleted = false AND l.elementType IS NOT NULL " +
           "GROUP BY l.elementType ORDER BY COUNT(l) DESC")
    List<Object[]> countByElementTypeForProject(@Param("projectId") UUID projectId);
}
