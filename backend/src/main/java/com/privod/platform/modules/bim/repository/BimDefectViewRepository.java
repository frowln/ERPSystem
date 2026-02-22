package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimDefectView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BimDefectViewRepository extends JpaRepository<BimDefectView, UUID> {

    List<BimDefectView> findByProjectIdAndDeletedFalse(UUID projectId);

    @Query("SELECT v FROM BimDefectView v WHERE v.projectId = :projectId AND v.deleted = false " +
           "AND (v.isShared = true OR v.createdBy = :username)")
    List<BimDefectView> findAccessibleByProjectId(
            @Param("projectId") UUID projectId,
            @Param("username") String username);
}
