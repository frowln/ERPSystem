package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.MinstroyIndexImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MinstroyIndexImportRepository extends JpaRepository<MinstroyIndexImport, UUID> {

    Optional<MinstroyIndexImport> findByQuarterAndDeletedFalse(String quarter);
}
