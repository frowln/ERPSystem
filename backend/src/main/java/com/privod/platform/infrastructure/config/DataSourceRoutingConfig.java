package com.privod.platform.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.Map;

/**
 * Configures read/write DataSource routing when a replica is available.
 * <p>
 * Activation: set {@code spring.datasource-replica.url} to the replica JDBC URL.
 * When not set, Spring Boot uses its default single-DataSource auto-configuration.
 */
@Configuration
@ConditionalOnProperty(name = "spring.datasource-replica.url")
@Slf4j
public class DataSourceRoutingConfig {

    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource primaryDataSource() {
        return primaryDataSourceProperties()
                .initializeDataSourceBuilder()
                .build();
    }

    @Bean
    public DataSource replicaDataSource(
            @Value("${spring.datasource-replica.url}") String url,
            @Value("${spring.datasource-replica.username}") String username,
            @Value("${spring.datasource-replica.password}") String password) {

        DataSourceProperties props = new DataSourceProperties();
        props.setUrl(url);
        props.setUsername(username);
        props.setPassword(password);
        props.setDriverClassName("org.postgresql.Driver");
        return props.initializeDataSourceBuilder().build();
    }

    @Primary
    @Bean
    public DataSource dataSource() {
        log.info("Read-replica routing enabled — read-only transactions routed to replica");

        ReadWriteRoutingDataSource routing = new ReadWriteRoutingDataSource();
        routing.setTargetDataSources(Map.of(
                ReadWriteRoutingDataSource.PRIMARY, primaryDataSource(),
                ReadWriteRoutingDataSource.REPLICA, replicaDataSource(
                        primaryDataSourceProperties().getUrl(),
                        primaryDataSourceProperties().getUsername(),
                        primaryDataSourceProperties().getPassword())
        ));
        routing.setDefaultTargetDataSource(primaryDataSource());
        return routing;
    }
}
