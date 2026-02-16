package com.privod.platform.modules.kep.repository;

import com.privod.platform.modules.kep.domain.KepConfig;
import com.privod.platform.modules.kep.domain.KepProviderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KepConfigRepository extends JpaRepository<KepConfig, UUID> {

    Optional<KepConfig> findByProviderTypeAndActiveTrue(KepProviderType providerType);

    List<KepConfig> findByActiveTrueAndDeletedFalse();

    Optional<KepConfig> findFirstByActiveTrueAndDeletedFalseOrderByCreatedAtDesc();
}
