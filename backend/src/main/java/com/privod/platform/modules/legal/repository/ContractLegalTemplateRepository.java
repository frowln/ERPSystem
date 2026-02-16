package com.privod.platform.modules.legal.repository;

import com.privod.platform.modules.legal.domain.ContractLegalTemplate;
import com.privod.platform.modules.legal.domain.LegalTemplateType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractLegalTemplateRepository extends JpaRepository<ContractLegalTemplate, UUID> {

    List<ContractLegalTemplate> findByActiveTrueAndDeletedFalseOrderByNameAsc();

    Page<ContractLegalTemplate> findByActiveTrueAndDeletedFalse(Pageable pageable);

    List<ContractLegalTemplate> findByTemplateTypeAndActiveTrueAndDeletedFalse(LegalTemplateType templateType);

    List<ContractLegalTemplate> findByCategoryAndActiveTrueAndDeletedFalse(String category);

    @Query("SELECT t FROM ContractLegalTemplate t WHERE t.deleted = false AND t.active = true AND " +
            "(LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ContractLegalTemplate> search(@Param("search") String search, Pageable pageable);
}
