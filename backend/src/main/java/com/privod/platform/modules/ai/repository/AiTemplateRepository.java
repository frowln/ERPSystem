package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiTemplateRepository extends JpaRepository<AiTemplate, UUID> {

    Optional<AiTemplate> findByCodeAndDeletedFalse(String code);

    List<AiTemplate> findByIsActiveTrueAndDeletedFalse();

    List<AiTemplate> findByCategoryAndIsActiveTrueAndDeletedFalse(String category);
}
