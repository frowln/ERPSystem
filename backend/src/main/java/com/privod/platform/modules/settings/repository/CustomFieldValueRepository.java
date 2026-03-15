package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, UUID> {

    List<CustomFieldValue> findByEntityTypeAndEntityIdAndDeletedFalse(String entityType, UUID entityId);

    List<CustomFieldValue> findByDefinitionIdAndDeletedFalse(UUID definitionId);

    Optional<CustomFieldValue> findByDefinitionIdAndEntityIdAndDeletedFalse(UUID definitionId, UUID entityId);

    @Modifying
    @Query("UPDATE CustomFieldValue v SET v.deleted = true WHERE v.entityType = :entityType AND v.entityId = :entityId")
    void softDeleteByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") UUID entityId);

    @Modifying
    @Query("UPDATE CustomFieldValue v SET v.deleted = true WHERE v.definitionId = :definitionId")
    void softDeleteByDefinitionId(@Param("definitionId") UUID definitionId);
}
