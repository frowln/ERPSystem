package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.ChecklistTemplate;
import com.privod.platform.modules.quality.domain.ChecklistWorkType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChecklistTemplateRepository extends JpaRepository<ChecklistTemplate, UUID> {

    Page<ChecklistTemplate> findByDeletedFalse(Pageable pageable);

    Page<ChecklistTemplate> findByWorkTypeAndDeletedFalse(ChecklistWorkType workType, Pageable pageable);
}
