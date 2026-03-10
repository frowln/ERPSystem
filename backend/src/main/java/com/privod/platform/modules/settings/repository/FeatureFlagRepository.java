package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, UUID> {

    Optional<FeatureFlag> findByKeyAndDeletedFalse(String key);

    List<FeatureFlag> findAllByDeletedFalseOrderByKeyAsc();
}
