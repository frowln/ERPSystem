package com.privod.platform.modules.permission.repository;

import com.privod.platform.modules.permission.domain.ModelAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModelAccessRepository extends JpaRepository<ModelAccess, UUID> {

    Optional<ModelAccess> findByModelNameAndGroupIdAndDeletedFalse(String modelName, UUID groupId);

    List<ModelAccess> findByModelNameAndDeletedFalse(String modelName);

    List<ModelAccess> findByGroupIdAndDeletedFalse(UUID groupId);

    @Query("SELECT ma FROM ModelAccess ma WHERE ma.modelName = :modelName " +
            "AND ma.groupId IN :groupIds AND ma.deleted = false")
    List<ModelAccess> findByModelNameAndGroupIdIn(
            @Param("modelName") String modelName,
            @Param("groupIds") List<UUID> groupIds);

    @Query("SELECT DISTINCT ma.modelName FROM ModelAccess ma WHERE ma.deleted = false ORDER BY ma.modelName")
    List<String> findAllDistinctModelNames();

    boolean existsByModelNameAndGroupIdAndDeletedFalse(String modelName, UUID groupId);
}
