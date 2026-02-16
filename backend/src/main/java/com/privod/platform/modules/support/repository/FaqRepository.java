package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FaqRepository extends JpaRepository<Faq, UUID> {

    Optional<Faq> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<Faq> findByOrganizationIdAndIsActiveTrueAndDeletedFalseOrderBySortOrderAsc(UUID organizationId);

    List<Faq> findByOrganizationIdAndCategoryIdAndIsActiveTrueAndDeletedFalseOrderBySortOrderAsc(UUID organizationId, UUID categoryId);
}
