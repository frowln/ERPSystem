package com.privod.platform.modules.m29.repository;

import com.privod.platform.modules.m29.domain.M29Line;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface M29LineRepository extends JpaRepository<M29Line, UUID> {

    List<M29Line> findByM29IdAndDeletedFalseOrderBySequenceAsc(UUID m29Id);
}
