package com.privod.platform.modules.organization.repository;

import com.privod.platform.modules.organization.domain.Organization;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    Optional<Organization> findByInn(String inn);

    boolean existsByInn(String inn);

    @Query("SELECT o FROM Organization o WHERE o.deleted = false AND o.active = true")
    Page<Organization> findAllActive(Pageable pageable);

    @Query("SELECT o FROM Organization o WHERE o.deleted = false AND o.active = true AND " +
            "(o.id = :orgId OR o.parentId = :orgId) AND " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "o.inn LIKE CONCAT('%', :search, '%'))")
    Page<Organization> findTenantOrganizations(@Param("orgId") UUID organizationId,
                                               @Param("search") String search,
                                               Pageable pageable);

    @Query("SELECT o FROM Organization o WHERE o.deleted = false AND " +
            "(LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "o.inn LIKE CONCAT('%', :search, '%'))")
    Page<Organization> search(@Param("search") String search, Pageable pageable);

    List<Organization> findByParentId(UUID parentId);
}
