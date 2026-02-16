package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.RegulatoryBody;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegulatoryBodyRepository extends JpaRepository<RegulatoryBody, UUID> {

    Page<RegulatoryBody> findByDeletedFalse(Pageable pageable);

    Optional<RegulatoryBody> findByCodeAndDeletedFalse(String code);
}
