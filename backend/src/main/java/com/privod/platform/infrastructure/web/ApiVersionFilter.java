package com.privod.platform.infrastructure.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Adds the {@code X-API-Version} header to every API response.
 * <p>
 * If a {@code X-RateLimit-Limit} value has been placed in the request attributes
 * (e.g. by an upstream filter or interceptor), it is also forwarded as a response header.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ApiVersionFilter extends OncePerRequestFilter {

    private static final String API_VERSION = "1.0";
    private static final String HEADER_API_VERSION = "X-API-Version";
    private static final String HEADER_RATE_LIMIT = "X-RateLimit-Limit";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        response.setHeader(HEADER_API_VERSION, API_VERSION);

        Object rateLimitAttr = request.getAttribute(HEADER_RATE_LIMIT);
        if (rateLimitAttr != null) {
            response.setHeader(HEADER_RATE_LIMIT, rateLimitAttr.toString());
        }

        filterChain.doFilter(request, response);
    }
}
