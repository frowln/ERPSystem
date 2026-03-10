package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.AccidentAct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccidentActRepository extends JpaRepository<AccidentAct, UUID>,
        JpaSpecificationExecutor<AccidentAct> {

    Optional<AccidentAct> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<AccidentAct> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<AccidentAct> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    Optional<AccidentAct> findByIncidentIdAndDeletedFalse(UUID incidentId);

    @Query(value = "SELECT nextval('accident_act_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
