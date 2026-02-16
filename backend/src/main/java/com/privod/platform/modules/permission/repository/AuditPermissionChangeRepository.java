package com.privod.platform.modules.permission.repository;

import com.privod.platform.modules.permission.domain.AuditPermissionChange;
import com.privod.platform.modules.permission.domain.PermissionAuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditPermissionChangeRepository extends JpaRepository<AuditPermissionChange, UUID> {

    Page<AuditPermissionChange> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<AuditPermissionChange> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId, Pageable pageable);

    List<AuditPermissionChange> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    Page<AuditPermissionChange> findByActionOrderByCreatedAtDesc(PermissionAuditAction action, Pageable pageable);

    Page<AuditPermissionChange> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
