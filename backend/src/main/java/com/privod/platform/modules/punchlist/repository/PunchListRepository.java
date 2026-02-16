package com.privod.platform.modules.punchlist.repository;

import com.privod.platform.modules.punchlist.domain.PunchList;
import com.privod.platform.modules.punchlist.domain.PunchListStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PunchListRepository extends JpaRepository<PunchList, UUID> {

    Optional<PunchList> findByIdAndDeletedFalse(UUID id);

    Page<PunchList> findByProjectIdInAndDeletedFalse(List<UUID> projectIds, Pageable pageable);

    Page<PunchList> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<PunchList> findByStatusAndDeletedFalse(PunchListStatus status, Pageable pageable);

    @Query("SELECT pl.status, COUNT(pl) FROM PunchList pl " +
            "WHERE pl.deleted = false AND (:projectId IS NULL OR pl.projectId = :projectId) " +
            "GROUP BY pl.status")
    List<Object[]> countByStatus(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(pl) FROM PunchList pl " +
            "WHERE pl.deleted = false AND (:projectId IS NULL OR pl.projectId = :projectId)")
    long countTotal(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('punch_list_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
