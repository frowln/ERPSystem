package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.KpiAchievement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KpiAchievementRepository extends JpaRepository<KpiAchievement, UUID> {

    Page<KpiAchievement> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    List<KpiAchievement> findByEmployeeIdAndPeriodAndDeletedFalse(UUID employeeId, String period);

    Page<KpiAchievement> findByPeriodAndDeletedFalse(String period, Pageable pageable);

    Page<KpiAchievement> findByDeletedFalse(Pageable pageable);
}
