/**
 * Persistence infrastructure — BaseEntity, converters, Hibernate filter definitions.
 * <p>
 * The tenant filter defined here is enabled per-request by {@link com.privod.platform.infrastructure.persistence.TenantFilterInterceptor}.
 * All tenant-scoped entities must annotate their class with:
 * <pre>
 * &#64;Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
 * </pre>
 */
@FilterDef(
        name = "tenantFilter",
        parameters = @ParamDef(name = "organizationId", type = UUID.class),
        defaultCondition = "organization_id = :organizationId"
)
package com.privod.platform.infrastructure.persistence;

import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.util.UUID;
