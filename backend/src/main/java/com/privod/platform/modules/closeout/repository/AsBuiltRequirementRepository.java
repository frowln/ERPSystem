package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.AsBuiltRequirement;
import com.privod.platform.modules.pto.domain.WorkType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsBuiltRequirementRepository extends JpaRepository<AsBuiltRequirement, UUID>,
        JpaSpecificationExecutor<AsBuiltRequirement> {

    Page<AsBuiltRequirement> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID orgId, UUID projectId, Pageable pageable);

    List<AsBuiltRequirement> findByOrganizationIdAndProjectIdIsNullAndDeletedFalse(UUID orgId);

    List<AsBuiltRequirement> findByOrganizationIdAndProjectIdAndWorkTypeAndDeletedFalse(UUID orgId, UUID projectId, WorkType workType);

    List<AsBuiltRequirement> findByOrganizationIdAndProjectIdIsNullAndWorkTypeAndDeletedFalse(UUID orgId, WorkType workType);
}
