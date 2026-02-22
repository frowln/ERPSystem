package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.BriefingType;
import com.privod.platform.modules.safety.domain.SafetyBriefingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SafetyBriefingRuleRepository extends JpaRepository<SafetyBriefingRule, UUID> {

    List<SafetyBriefingRule> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    List<SafetyBriefingRule> findByOrganizationIdAndBriefingTypeAndDeletedFalse(UUID organizationId,
                                                                                BriefingType briefingType);
}
