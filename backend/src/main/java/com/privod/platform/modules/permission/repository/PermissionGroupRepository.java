package com.privod.platform.modules.permission.repository;

import com.privod.platform.modules.permission.domain.PermissionGroup;
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
public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, UUID> {

    Optional<PermissionGroup> findByNameAndDeletedFalse(String name);

    List<PermissionGroup> findByCategoryAndDeletedFalseOrderBySequence(String category);

    List<PermissionGroup> findByIsActiveTrueAndDeletedFalseOrderBySequence();

    List<PermissionGroup> findByParentGroupIdAndDeletedFalse(UUID parentGroupId);

    Page<PermissionGroup> findByDeletedFalseOrderBySequence(Pageable pageable);

    @Query("SELECT pg FROM PermissionGroup pg WHERE pg.deleted = false AND pg.isActive = true ORDER BY pg.sequence")
    List<PermissionGroup> findAllActive();

    @Query("SELECT pg FROM PermissionGroup pg WHERE pg.deleted = false AND " +
            "(LOWER(pg.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(pg.displayName) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY pg.sequence")
    List<PermissionGroup> searchByNameOrDisplayName(@Param("search") String search);

    boolean existsByNameAndDeletedFalse(String name);
}
