package com.privod.platform.modules.specification.repository;

import com.privod.platform.modules.specification.domain.CompetitiveList;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitiveListRepository extends JpaRepository<CompetitiveList, UUID> {

    Page<CompetitiveList> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<CompetitiveList> findBySpecificationIdAndDeletedFalse(UUID specificationId);

    Optional<CompetitiveList> findByIdAndDeletedFalse(UUID id);
}
