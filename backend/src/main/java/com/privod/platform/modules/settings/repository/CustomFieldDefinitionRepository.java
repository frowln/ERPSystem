package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.CustomFieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomFieldDefinitionRepository extends JpaRepository<CustomFieldDefinition, UUID> {

    List<CustomFieldDefinition> findByOrganizationIdAndEntityTypeAndDeletedFalseOrderBySortOrder(
            UUID organizationId, String entityType);

    List<CustomFieldDefinition> findByOrganizationIdAndDeletedFalseOrderByEntityTypeAscSortOrderAsc(
            UUID organizationId);

    Optional<CustomFieldDefinition> findByIdAndDeletedFalse(UUID id);

    boolean existsByOrganizationIdAndEntityTypeAndFieldKeyAndDeletedFalse(
            UUID organizationId, String entityType, String fieldKey);
}
