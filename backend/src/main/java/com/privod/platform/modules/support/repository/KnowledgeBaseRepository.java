package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.KnowledgeBase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, UUID> {

    Page<KnowledgeBase> findByIsPublishedTrueAndDeletedFalse(Pageable pageable);

    Page<KnowledgeBase> findByCategoryIdAndDeletedFalse(UUID categoryId, Pageable pageable);
}
