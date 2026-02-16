package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.EdoTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EdoTemplateRepository extends JpaRepository<EdoTemplate, UUID> {

    Page<EdoTemplate> findByDeletedFalse(Pageable pageable);

    Optional<EdoTemplate> findByCodeAndDeletedFalse(String code);

    List<EdoTemplate> findByDocumentTypeAndIsActiveTrueAndDeletedFalse(String documentType);

    List<EdoTemplate> findByIsActiveTrueAndDeletedFalse();
}
