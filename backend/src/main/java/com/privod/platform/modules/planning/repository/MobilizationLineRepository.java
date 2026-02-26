package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.MobilizationLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MobilizationLineRepository extends JpaRepository<MobilizationLine, UUID> {

    List<MobilizationLine> findByScheduleIdOrderByResourceTypeAscResourceNameAsc(UUID scheduleId);
}
