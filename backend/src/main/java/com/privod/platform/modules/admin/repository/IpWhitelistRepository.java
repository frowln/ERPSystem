package com.privod.platform.modules.admin.repository;

import com.privod.platform.modules.admin.domain.IpWhitelist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IpWhitelistRepository extends JpaRepository<IpWhitelist, UUID> {
    List<IpWhitelist> findByOrganizationIdAndIsActiveTrueOrderByCreatedAtDesc(UUID organizationId);
    List<IpWhitelist> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    boolean existsByOrganizationIdAndIpAddressAndIsActiveTrue(UUID organizationId, String ipAddress);
}
