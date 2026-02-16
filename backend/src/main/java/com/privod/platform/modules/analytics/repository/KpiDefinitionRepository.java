package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.KpiCategory;
import com.privod.platform.modules.analytics.domain.KpiDefinition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KpiDefinitionRepository extends JpaRepository<KpiDefinition, UUID> {

    Optional<KpiDefinition> findByCodeAndDeletedFalse(String code);

    List<KpiDefinition> findByCategoryAndIsActiveTrueAndDeletedFalse(KpiCategory category);

    List<KpiDefinition> findByIsActiveTrueAndDeletedFalse();

    Page<KpiDefinition> findByDeletedFalse(Pageable pageable);

    Page<KpiDefinition> findByCategoryAndDeletedFalse(KpiCategory category, Pageable pageable);

    boolean existsByCodeAndDeletedFalse(String code);
}
