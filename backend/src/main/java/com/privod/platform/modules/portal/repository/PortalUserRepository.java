package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.PortalRole;
import com.privod.platform.modules.portal.domain.PortalUser;
import com.privod.platform.modules.portal.domain.PortalUserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortalUserRepository extends JpaRepository<PortalUser, UUID>, JpaSpecificationExecutor<PortalUser> {

    Optional<PortalUser> findByEmailAndDeletedFalse(String email);

    boolean existsByEmailAndDeletedFalse(String email);

    Page<PortalUser> findByStatusAndDeletedFalse(PortalUserStatus status, Pageable pageable);

    Page<PortalUser> findByPortalRoleAndDeletedFalse(PortalRole role, Pageable pageable);

    Page<PortalUser> findByDeletedFalse(Pageable pageable);
}
