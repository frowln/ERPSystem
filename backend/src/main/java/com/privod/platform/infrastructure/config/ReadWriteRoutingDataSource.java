package com.privod.platform.infrastructure.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Routes read-only transactions to the replica DataSource when available.
 * Activated only when {@code spring.datasource-replica.url} is configured.
 */
public class ReadWriteRoutingDataSource extends AbstractRoutingDataSource {

    public static final String PRIMARY = "primary";
    public static final String REPLICA = "replica";

    @Override
    protected Object determineCurrentLookupKey() {
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
                ? REPLICA
                : PRIMARY;
    }
}
