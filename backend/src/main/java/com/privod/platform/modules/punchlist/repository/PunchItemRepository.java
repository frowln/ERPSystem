package com.privod.platform.modules.punchlist.repository;

import com.privod.platform.modules.punchlist.domain.PunchItem;
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
public interface PunchItemRepository extends JpaRepository<PunchItem, UUID> {

    Optional<PunchItem> findByIdAndDeletedFalse(UUID id);

    List<PunchItem> findByPunchListIdAndDeletedFalse(UUID punchListId);

    Page<PunchItem> findByPunchListIdAndDeletedFalse(UUID punchListId, Pageable pageable);

    List<PunchItem> findByAssignedToIdAndDeletedFalse(UUID assignedToId);

    @Query("SELECT pi.status, COUNT(pi) FROM PunchItem pi " +
            "WHERE pi.deleted = false AND pi.punchListId = :punchListId " +
            "GROUP BY pi.status")
    List<Object[]> countByStatusForList(@Param("punchListId") UUID punchListId);

    @Query("SELECT COUNT(pi) FROM PunchItem pi " +
            "WHERE pi.deleted = false AND pi.punchListId = :punchListId")
    long countByPunchListId(@Param("punchListId") UUID punchListId);

    @Query("SELECT COUNT(pi) FROM PunchItem pi " +
            "WHERE pi.deleted = false AND pi.punchListId = :punchListId " +
            "AND pi.status IN ('VERIFIED', 'CLOSED')")
    long countCompletedByPunchListId(@Param("punchListId") UUID punchListId);

    @Query("SELECT COALESCE(MAX(pi.number), 0) FROM PunchItem pi " +
            "WHERE pi.punchListId = :punchListId")
    int getMaxNumberForList(@Param("punchListId") UUID punchListId);
}
