package com.privod.platform.modules.permission.repository;

import com.privod.platform.modules.permission.domain.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroup, UUID> {

    Page<UserGroup> findByDeletedFalse(Pageable pageable);

    List<UserGroup> findByUserIdAndDeletedFalse(UUID userId);

    List<UserGroup> findByGroupIdAndDeletedFalse(UUID groupId);

    Optional<UserGroup> findByUserIdAndGroupIdAndDeletedFalse(UUID userId, UUID groupId);

    boolean existsByUserIdAndGroupIdAndDeletedFalse(UUID userId, UUID groupId);

    @Query("SELECT ug.groupId FROM UserGroup ug WHERE ug.userId = :userId AND ug.deleted = false")
    List<UUID> findGroupIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT ug.userId FROM UserGroup ug WHERE ug.groupId = :groupId AND ug.deleted = false")
    List<UUID> findUserIdsByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT COUNT(ug) FROM UserGroup ug WHERE ug.groupId = :groupId AND ug.deleted = false")
    long countByGroupId(@Param("groupId") UUID groupId);
}
