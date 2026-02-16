package com.privod.platform.modules.project.repository;

import com.privod.platform.modules.project.domain.ProjectCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectCollaboratorRepository extends JpaRepository<ProjectCollaborator, UUID> {

    List<ProjectCollaborator> findByProjectIdAndDeletedFalse(UUID projectId);

    List<ProjectCollaborator> findByPartnerIdAndDeletedFalse(UUID partnerId);

    Optional<ProjectCollaborator> findByProjectIdAndPartnerIdAndDeletedFalse(UUID projectId, UUID partnerId);

    boolean existsByProjectIdAndPartnerIdAndDeletedFalse(UUID projectId, UUID partnerId);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
