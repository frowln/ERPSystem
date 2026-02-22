package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.ClientClaimActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientClaimActivityRepository extends JpaRepository<ClientClaimActivity, UUID> {

    List<ClientClaimActivity> findByClaimIdAndDeletedFalseOrderByCreatedAtDesc(UUID claimId);
}
