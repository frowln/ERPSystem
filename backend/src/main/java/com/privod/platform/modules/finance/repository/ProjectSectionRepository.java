package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.ProjectSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectSectionRepository extends JpaRepository<ProjectSection, UUID> {
    List<ProjectSection> findByProjectIdAndDeletedFalseOrderBySequenceAsc(UUID projectId);
    Optional<ProjectSection> findByProjectIdAndCodeAndDeletedFalse(UUID projectId, String code);
    boolean existsByProjectIdAndDeletedFalse(UUID projectId);
    boolean existsByProjectIdAndCodeAndDeletedFalse(UUID projectId, String code);
}
