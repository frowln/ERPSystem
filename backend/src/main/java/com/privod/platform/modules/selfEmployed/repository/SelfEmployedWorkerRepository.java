package com.privod.platform.modules.selfEmployed.repository;

import com.privod.platform.modules.selfEmployed.domain.NpdStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedWorker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SelfEmployedWorkerRepository extends JpaRepository<SelfEmployedWorker, UUID> {

    Page<SelfEmployedWorker> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<SelfEmployedWorker> findByDeletedFalse(Pageable pageable);

    Optional<SelfEmployedWorker> findByInnAndDeletedFalse(String inn);

    boolean existsByInnAndOrganizationIdAndDeletedFalse(String inn, UUID organizationId);

    @Query("SELECT w FROM SelfEmployedWorker w WHERE w.deleted = false AND w.organizationId = :orgId AND " +
            "(LOWER(w.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "w.inn LIKE CONCAT('%', :search, '%'))")
    Page<SelfEmployedWorker> searchByNameOrInn(@Param("orgId") UUID orgId,
                                                @Param("search") String search,
                                                Pageable pageable);

    Page<SelfEmployedWorker> findByNpdStatusAndDeletedFalse(NpdStatus npdStatus, Pageable pageable);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
