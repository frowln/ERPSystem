package com.privod.platform.modules.project.repository;

import com.privod.platform.modules.project.domain.ProjectMember;
import com.privod.platform.modules.project.domain.ProjectMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    List<ProjectMember> findByProjectIdAndLeftAtIsNull(UUID projectId);

    List<ProjectMember> findByProjectId(UUID projectId);

    List<ProjectMember> findByUserIdAndLeftAtIsNull(UUID userId);

    Optional<ProjectMember> findByProjectIdAndUserIdAndRoleAndLeftAtIsNull(
            UUID projectId, UUID userId, ProjectMemberRole role);

    boolean existsByProjectIdAndUserIdAndLeftAtIsNull(UUID projectId, UUID userId);

    long countByProjectIdAndLeftAtIsNull(UUID projectId);
}
