package com.privod.platform.modules.recruitment.repository;

import com.privod.platform.modules.recruitment.domain.JobPosition;
import com.privod.platform.modules.recruitment.domain.JobPositionStatus;
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
public interface JobPositionRepository extends JpaRepository<JobPosition, UUID>, JpaSpecificationExecutor<JobPosition> {

    Page<JobPosition> findByStatusAndDeletedFalse(JobPositionStatus status, Pageable pageable);

    Page<JobPosition> findByDepartmentIdAndDeletedFalse(UUID departmentId, Pageable pageable);

    @Query("SELECT jp FROM JobPosition jp WHERE jp.deleted = false AND " +
            "LOWER(jp.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<JobPosition> search(@Param("search") String search, Pageable pageable);

    List<JobPosition> findByStatusAndDeletedFalse(JobPositionStatus status);
}
