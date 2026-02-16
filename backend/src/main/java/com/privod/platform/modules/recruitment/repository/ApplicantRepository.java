package com.privod.platform.modules.recruitment.repository;

import com.privod.platform.modules.recruitment.domain.Applicant;
import com.privod.platform.modules.recruitment.domain.ApplicantStatus;
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
public interface ApplicantRepository extends JpaRepository<Applicant, UUID>, JpaSpecificationExecutor<Applicant> {

    Page<Applicant> findByJobPositionIdAndDeletedFalse(UUID jobPositionId, Pageable pageable);

    Page<Applicant> findByStatusAndDeletedFalse(ApplicantStatus status, Pageable pageable);

    Page<Applicant> findByStageIdAndDeletedFalse(UUID stageId, Pageable pageable);

    @Query("SELECT a FROM Applicant a WHERE a.deleted = false AND " +
            "(LOWER(a.partnerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Applicant> search(@Param("search") String search, Pageable pageable);

    List<Applicant> findByJobPositionIdAndDeletedFalse(UUID jobPositionId);

    long countByJobPositionIdAndStatusAndDeletedFalse(UUID jobPositionId, ApplicantStatus status);
}
