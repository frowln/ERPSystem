package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.DispatchRoute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DispatchRouteRepository extends JpaRepository<DispatchRoute, UUID> {

    List<DispatchRoute> findByIsActiveTrueAndDeletedFalse();

    Page<DispatchRoute> findByDeletedFalse(Pageable pageable);
}
