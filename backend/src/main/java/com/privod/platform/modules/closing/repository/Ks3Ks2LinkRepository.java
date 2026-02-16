package com.privod.platform.modules.closing.repository;

import com.privod.platform.modules.closing.domain.Ks3Ks2Link;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface Ks3Ks2LinkRepository extends JpaRepository<Ks3Ks2Link, UUID> {

    List<Ks3Ks2Link> findByKs3IdAndDeletedFalse(UUID ks3Id);

    List<Ks3Ks2Link> findByKs2IdAndDeletedFalse(UUID ks2Id);

    boolean existsByKs3IdAndKs2IdAndDeletedFalse(UUID ks3Id, UUID ks2Id);

    Optional<Ks3Ks2Link> findByKs3IdAndKs2IdAndDeletedFalse(UUID ks3Id, UUID ks2Id);
}
