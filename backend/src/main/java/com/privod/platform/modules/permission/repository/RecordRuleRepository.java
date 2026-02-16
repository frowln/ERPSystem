package com.privod.platform.modules.permission.repository;

import com.privod.platform.modules.permission.domain.RecordRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecordRuleRepository extends JpaRepository<RecordRule, UUID> {

    List<RecordRule> findByModelNameAndDeletedFalse(String modelName);

    List<RecordRule> findByGroupIdAndDeletedFalse(UUID groupId);

    List<RecordRule> findByModelNameAndIsGlobalTrueAndDeletedFalse(String modelName);

    @Query("SELECT rr FROM RecordRule rr WHERE rr.modelName = :modelName " +
            "AND (rr.groupId IN :groupIds OR rr.isGlobal = true) AND rr.deleted = false")
    List<RecordRule> findApplicableRules(
            @Param("modelName") String modelName,
            @Param("groupIds") List<UUID> groupIds);

    @Query("SELECT rr FROM RecordRule rr WHERE rr.modelName = :modelName " +
            "AND rr.isGlobal = true AND rr.deleted = false")
    List<RecordRule> findGlobalRules(@Param("modelName") String modelName);
}
