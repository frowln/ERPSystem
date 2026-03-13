package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.Crew;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrewRepository extends JpaRepository<Crew, UUID> {

    List<Crew> findByOrganizationIdAndDeletedFalseOrderByNameAsc(UUID orgId);

    List<Crew> findByOrganizationIdAndStatusAndDeletedFalseOrderByNameAsc(UUID orgId, Crew.CrewStatus status);
}
