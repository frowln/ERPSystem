package com.privod.platform.modules.permission.repository;

import com.privod.platform.modules.permission.domain.FieldAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FieldAccessRepository extends JpaRepository<FieldAccess, UUID> {

    Optional<FieldAccess> findByModelNameAndFieldNameAndGroupIdAndDeletedFalse(
            String modelName, String fieldName, UUID groupId);

    List<FieldAccess> findByModelNameAndFieldNameAndDeletedFalse(String modelName, String fieldName);

    List<FieldAccess> findByModelNameAndGroupIdAndDeletedFalse(String modelName, UUID groupId);

    List<FieldAccess> findByGroupIdAndDeletedFalse(UUID groupId);

    @Query("SELECT fa FROM FieldAccess fa WHERE fa.modelName = :modelName " +
            "AND fa.fieldName = :fieldName AND fa.groupId IN :groupIds AND fa.deleted = false")
    List<FieldAccess> findByModelNameAndFieldNameAndGroupIdIn(
            @Param("modelName") String modelName,
            @Param("fieldName") String fieldName,
            @Param("groupIds") List<UUID> groupIds);

    boolean existsByModelNameAndFieldNameAndGroupIdAndDeletedFalse(
            String modelName, String fieldName, UUID groupId);
}
