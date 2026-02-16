package com.privod.platform.modules.procurementExt.service;

import com.privod.platform.modules.procurementExt.domain.Delivery;
import com.privod.platform.modules.procurementExt.domain.DeliveryStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class DeliverySpecification {

    private DeliverySpecification() {
    }

    public static Specification<Delivery> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Delivery> hasStatus(DeliveryStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Delivery> hasRoute(UUID routeId) {
        return (root, query, cb) -> {
            if (routeId == null) return cb.conjunction();
            return cb.equal(root.get("routeId"), routeId);
        };
    }
}
