package com.privod.platform.modules.crm.repository;

import com.privod.platform.modules.crm.domain.CrmTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmTeamRepository extends JpaRepository<CrmTeam, UUID> {

    List<CrmTeam> findByActiveTrueAndDeletedFalseOrderByNameAsc();

    Optional<CrmTeam> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<CrmTeam> findByOrganizationIdAndActiveTrueAndDeletedFalseOrderByNameAsc(UUID organizationId);

    List<CrmTeam> findByOrganizationIdAndLeaderIdAndDeletedFalse(UUID organizationId, UUID leaderId);

    List<CrmTeam> findByLeaderIdAndDeletedFalse(UUID leaderId);
}
