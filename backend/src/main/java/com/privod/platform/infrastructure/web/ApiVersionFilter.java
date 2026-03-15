package com.privod.platform.infrastructure.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Adds API versioning and deprecation headers to every {@code /api/**} response.
 * <p>
 * Headers added:
 * <ul>
 *   <li>{@code X-API-Version} — current API version from {@code app.api.version}</li>
 *   <li>{@code X-API-Deprecated: true} — if the endpoint path is in the deprecated set</li>
 *   <li>{@code Sunset: <date>} — sunset date for deprecated endpoints (RFC 7231)</li>
 * </ul>
 * <p>
 * If a {@code X-RateLimit-Limit} value has been placed in the request attributes
 * (e.g. by an upstream filter or interceptor), it is also forwarded as a response header.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ApiVersionFilter extends OncePerRequestFilter {

    private static final String HEADER_API_VERSION = "X-API-Version";
    private static final String HEADER_API_DEPRECATED = "X-API-Deprecated";
    private static final String HEADER_SUNSET = "Sunset";
    private static final String HEADER_RATE_LIMIT = "X-RateLimit-Limit";

    /** Default sunset date for deprecated endpoints (ISO 8601). */
    private static final String DEFAULT_SUNSET_DATE = "2027-01-01T00:00:00Z";

    @Value("${app.api.version:1.0}")
    private String apiVersion;

    /**
     * Deprecated endpoint prefixes.
     * Add path prefixes here as endpoints get deprecated. Requests whose URI
     * starts with any of these prefixes will receive deprecation headers.
     */
    private static final Set<String> DEPRECATED_ENDPOINTS = Set.of();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith("/api/")) {
            response.setHeader(HEADER_API_VERSION, apiVersion);

            if (isDeprecated(path)) {
                response.setHeader(HEADER_API_DEPRECATED, "true");
                response.setHeader(HEADER_SUNSET, DEFAULT_SUNSET_DATE);
            }
        }

        Object rateLimitAttr = request.getAttribute(HEADER_RATE_LIMIT);
        if (rateLimitAttr != null) {
            response.setHeader(HEADER_RATE_LIMIT, rateLimitAttr.toString());
        }

        filterChain.doFilter(request, response);
    }

    private boolean isDeprecated(String path) {
        return DEPRECATED_ENDPOINTS.stream().anyMatch(path::startsWith);
    }
}
