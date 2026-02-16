package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MailSubtype;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MailSubtypeRepository extends JpaRepository<MailSubtype, UUID> {

    @Query("SELECT s FROM MailSubtype s WHERE s.deleted = false ORDER BY s.sequence ASC")
    List<MailSubtype> findAllActive();

    @Query("SELECT s FROM MailSubtype s WHERE s.isDefault = true AND s.deleted = false ORDER BY s.sequence ASC")
    List<MailSubtype> findDefaults();

    @Query("SELECT s FROM MailSubtype s WHERE (s.modelName IS NULL OR s.modelName = :modelName) " +
            "AND s.deleted = false ORDER BY s.sequence ASC")
    List<MailSubtype> findByModelName(@Param("modelName") String modelName);

    @Query("SELECT s FROM MailSubtype s WHERE s.parentId = :parentId AND s.deleted = false " +
            "ORDER BY s.sequence ASC")
    List<MailSubtype> findByParentId(@Param("parentId") UUID parentId);
}
