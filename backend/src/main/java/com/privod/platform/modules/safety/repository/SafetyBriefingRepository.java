package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.BriefingStatus;
import com.privod.platform.modules.safety.domain.BriefingType;
import com.privod.platform.modules.safety.domain.SafetyBriefing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SafetyBriefingRepository extends JpaRepository<SafetyBriefing, UUID>,
        JpaSpecificationExecutor<SafetyBriefing> {

    Page<SafetyBriefing> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<SafetyBriefing> findByOrganizationIdAndBriefingTypeAndDeletedFalse(UUID organizationId, BriefingType type);

    List<SafetyBriefing> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, BriefingStatus status);
}
