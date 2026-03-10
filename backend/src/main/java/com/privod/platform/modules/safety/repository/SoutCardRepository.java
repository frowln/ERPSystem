package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SoutCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SoutCardRepository extends JpaRepository<SoutCard, UUID>,
        JpaSpecificationExecutor<SoutCard> {

    Optional<SoutCard> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<SoutCard> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<SoutCard> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    @Query(value = "SELECT nextval('sout_card_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
