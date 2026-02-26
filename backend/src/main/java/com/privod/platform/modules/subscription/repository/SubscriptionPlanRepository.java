package com.privod.platform.modules.subscription.repository;

import com.privod.platform.modules.subscription.domain.PlanName;
import com.privod.platform.modules.subscription.domain.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    List<SubscriptionPlan> findByIsActiveTrueAndDeletedFalseOrderByPriceAsc();

    Optional<SubscriptionPlan> findByNameAndDeletedFalse(PlanName name);

    Optional<SubscriptionPlan> findByIdAndDeletedFalse(UUID id);
}
