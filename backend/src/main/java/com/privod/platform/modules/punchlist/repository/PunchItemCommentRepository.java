package com.privod.platform.modules.punchlist.repository;

import com.privod.platform.modules.punchlist.domain.PunchItemComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PunchItemCommentRepository extends JpaRepository<PunchItemComment, UUID> {

    List<PunchItemComment> findByPunchItemIdAndDeletedFalseOrderByCreatedAtDesc(UUID punchItemId);
}
