package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.EmailTemplate;
import com.privod.platform.modules.settings.domain.EmailTemplateCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {

    Optional<EmailTemplate> findByCodeAndDeletedFalse(String code);

    List<EmailTemplate> findByCategoryAndDeletedFalseOrderByNameAsc(EmailTemplateCategory category);

    Page<EmailTemplate> findByDeletedFalse(Pageable pageable);

    @Query("SELECT e FROM EmailTemplate e WHERE e.deleted = false AND e.isActive = true AND " +
           "(LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<EmailTemplate> searchByNameOrCode(String search, Pageable pageable);

    boolean existsByCodeAndDeletedFalse(String code);
}
