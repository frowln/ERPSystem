package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.ToleranceCategory;
import com.privod.platform.modules.quality.domain.ToleranceRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ToleranceRuleRepository extends JpaRepository<ToleranceRule, UUID>,
        JpaSpecificationExecutor<ToleranceRule> {

    Page<ToleranceRule> findByDeletedFalse(Pageable pageable);

    Page<ToleranceRule> findByCategoryAndDeletedFalse(ToleranceCategory category, Pageable pageable);

    List<ToleranceRule> findByIsActiveTrueAndDeletedFalse();

    List<ToleranceRule> findByCategoryAndIsActiveTrueAndDeletedFalse(ToleranceCategory category);

    Optional<ToleranceRule> findByCodeAndDeletedFalse(String code);
}
