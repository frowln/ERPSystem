package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FaqRepository extends JpaRepository<Faq, UUID> {

    List<Faq> findByIsActiveTrueAndDeletedFalseOrderBySortOrderAsc();

    List<Faq> findByCategoryIdAndIsActiveTrueAndDeletedFalseOrderBySortOrderAsc(UUID categoryId);
}
