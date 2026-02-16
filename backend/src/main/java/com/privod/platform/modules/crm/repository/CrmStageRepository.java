package com.privod.platform.modules.crm.repository;

import com.privod.platform.modules.crm.domain.CrmStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmStageRepository extends JpaRepository<CrmStage, UUID> {

    List<CrmStage> findByDeletedFalseOrderBySequenceAsc();

    Optional<CrmStage> findByNameAndDeletedFalse(String name);

    Optional<CrmStage> findFirstByWonTrueAndDeletedFalse();

    Optional<CrmStage> findFirstByClosedTrueAndWonFalseAndDeletedFalse();
}
