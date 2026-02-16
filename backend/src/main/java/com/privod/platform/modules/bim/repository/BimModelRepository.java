package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimModel;
import com.privod.platform.modules.bim.domain.BimModelStatus;
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
public interface BimModelRepository extends JpaRepository<BimModel, UUID>,
        JpaSpecificationExecutor<BimModel> {

    Page<BimModel> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<BimModel> findByDeletedFalse(Pageable pageable);

    List<BimModel> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, BimModelStatus status);

    @Query(value = "SELECT nextval('bim_model_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    @Query("SELECT m.status, COUNT(m) FROM BimModel m " +
            "WHERE m.deleted = false AND (:projectId IS NULL OR m.projectId = :projectId) " +
            "GROUP BY m.status")
    List<Object[]> countByStatus(@Param("projectId") UUID projectId);
}
