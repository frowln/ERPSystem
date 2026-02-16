package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.OidcProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OidcProviderRepository extends JpaRepository<OidcProvider, UUID> {

    Optional<OidcProvider> findByCodeAndDeletedFalse(String code);

    List<OidcProvider> findByIsActiveTrueAndDeletedFalse();

    boolean existsByCodeAndDeletedFalse(String code);
}
