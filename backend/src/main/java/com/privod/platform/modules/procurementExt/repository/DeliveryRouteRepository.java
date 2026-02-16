package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.DeliveryRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryRouteRepository extends JpaRepository<DeliveryRoute, UUID> {

    @Query(value = "SELECT nextval('delivery_route_code_seq')", nativeQuery = true)
    long getNextCodeSequence();

    List<DeliveryRoute> findByActiveTrueAndDeletedFalse();
}
