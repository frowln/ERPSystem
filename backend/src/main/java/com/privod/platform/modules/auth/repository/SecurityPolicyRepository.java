package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.SecurityPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityPolicyRepository extends JpaRepository<SecurityPolicy, UUID> {

    Optional<SecurityPolicy> findByIsActiveTrueAndDeletedFalse();
}
