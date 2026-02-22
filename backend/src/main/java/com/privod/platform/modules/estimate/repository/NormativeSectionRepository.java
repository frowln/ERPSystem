package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.NormativeSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NormativeSectionRepository extends JpaRepository<NormativeSection, UUID> {

    List<NormativeSection> findByDatabaseIdAndDeletedFalse(UUID databaseId);

    List<NormativeSection> findByDatabaseIdAndParentIdAndDeletedFalse(UUID databaseId, UUID parentId);

    List<NormativeSection> findByDatabaseIdAndParentIdIsNullAndDeletedFalse(UUID databaseId);

    Optional<NormativeSection> findByCodeAndDatabaseIdAndDeletedFalse(String code, UUID databaseId);
}
