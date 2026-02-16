package com.privod.platform.modules.crm.repository;

import com.privod.platform.modules.crm.domain.CrmStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmStageRepository extends JpaRepository<CrmStage, UUID> {

    List<CrmStage> findByDeletedFalseOrderBySequenceAsc();

    @Query("SELECT s FROM CrmStage s WHERE s.deleted = false AND " +
            "(s.organizationId = :organizationId OR s.organizationId IS NULL) ORDER BY s.sequence ASC")
    List<CrmStage> findAccessibleByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT s FROM CrmStage s WHERE s.id = :id AND s.deleted = false AND " +
            "(s.organizationId = :organizationId OR s.organizationId IS NULL)")
    Optional<CrmStage> findAccessibleById(@Param("id") UUID id,
                                          @Param("organizationId") UUID organizationId);

    Optional<CrmStage> findByNameAndDeletedFalse(String name);

    Optional<CrmStage> findByOrganizationIdAndNameAndDeletedFalse(UUID organizationId, String name);

    Optional<CrmStage> findFirstByWonTrueAndDeletedFalse();

    Optional<CrmStage> findFirstByClosedTrueAndWonFalseAndDeletedFalse();
}
