package com.privod.platform.modules.subscription.repository;

import com.privod.platform.modules.subscription.domain.SubscriptionStatus;
import com.privod.platform.modules.subscription.domain.TenantSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscription, UUID> {

    Optional<TenantSubscription> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<TenantSubscription> findByOrganizationIdAndStatusAndDeletedFalse(
            UUID organizationId, SubscriptionStatus status);
}
