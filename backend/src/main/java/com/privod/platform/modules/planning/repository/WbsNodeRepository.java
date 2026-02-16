package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.domain.WbsNodeType;
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
public interface WbsNodeRepository extends JpaRepository<WbsNode, UUID>, JpaSpecificationExecutor<WbsNode> {

    Page<WbsNode> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<WbsNode> findByProjectIdAndDeletedFalseOrderBySortOrder(UUID projectId);

    List<WbsNode> findByParentIdAndDeletedFalseOrderBySortOrder(UUID parentId);

    List<WbsNode> findByProjectIdAndNodeTypeAndDeletedFalse(UUID projectId, WbsNodeType nodeType);

    List<WbsNode> findByProjectIdAndIsCriticalTrueAndDeletedFalse(UUID projectId);

    @Query("SELECT w FROM WbsNode w WHERE w.projectId = :projectId AND w.parentId IS NULL AND w.deleted = false ORDER BY w.sortOrder")
    List<WbsNode> findRootNodesByProjectId(@Param("projectId") UUID projectId);

    Page<WbsNode> findByDeletedFalse(Pageable pageable);

    @Query("SELECT COUNT(w) FROM WbsNode w WHERE w.projectId = :projectId AND w.deleted = false")
    long countByProjectId(@Param("projectId") UUID projectId);
}
