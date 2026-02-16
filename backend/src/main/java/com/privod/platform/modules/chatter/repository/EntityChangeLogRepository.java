package com.privod.platform.modules.chatter.repository;

import com.privod.platform.modules.chatter.domain.EntityChangeLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EntityChangeLogRepository extends JpaRepository<EntityChangeLog, UUID> {

    Page<EntityChangeLog> findByEntityTypeAndEntityIdAndDeletedFalse(
            String entityType, UUID entityId, Pageable pageable);

    Page<EntityChangeLog> findByEntityTypeAndEntityIdAndFieldNameAndDeletedFalse(
            String entityType, UUID entityId, String fieldName, Pageable pageable);
}
