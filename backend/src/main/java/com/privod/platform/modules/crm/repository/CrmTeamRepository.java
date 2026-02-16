package com.privod.platform.modules.crm.repository;

import com.privod.platform.modules.crm.domain.CrmTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmTeamRepository extends JpaRepository<CrmTeam, UUID> {

    List<CrmTeam> findByActiveTrueAndDeletedFalseOrderByNameAsc();

    List<CrmTeam> findByLeaderIdAndDeletedFalse(UUID leaderId);
}
