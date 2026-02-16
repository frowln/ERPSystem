package com.privod.platform.modules.design.repository;

import com.privod.platform.modules.design.domain.DesignSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DesignSectionRepository extends JpaRepository<DesignSection, UUID> {

    List<DesignSection> findByProjectIdAndDeletedFalseOrderBySequenceAsc(UUID projectId);

    List<DesignSection> findByParentIdAndDeletedFalseOrderBySequenceAsc(UUID parentId);

    List<DesignSection> findByProjectIdAndParentIdIsNullAndDeletedFalseOrderBySequenceAsc(UUID projectId);
}
