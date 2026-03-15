package com.privod.platform.infrastructure.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rewrites versioned API paths ({@code /api/v1/**}) to the unversioned form ({@code /api/**}).
 * <p>
 * This allows API consumers to use explicit version prefixes (e.g. {@code /api/v1/projects})
 * while the backend controllers remain mapped to {@code /api/projects}. The filter runs
 * before {@link RequestLoggingFilter} and {@link ApiVersionFilter} so that downstream
 * filters and controllers see the canonical path.
 * <p>
 * Currently only {@code v1} is supported. When v2 is introduced, a separate set of
 * controllers should handle the new version and this filter can be updated accordingly.
 */
@Component
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 3)
public class ApiVersionRewriteFilter extends OncePerRequestFilter {

    private static final String V1_PREFIX = "/api/v1/";
    private static final String API_PREFIX = "/api/";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        if (uri.startsWith(V1_PREFIX)) {
            String rewritten = API_PREFIX + uri.substring(V1_PREFIX.length());
            log.debug("Rewriting versioned path {} -> {}", uri, rewritten);

            filterChain.doFilter(new VersionRewriteRequestWrapper(request, rewritten), response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Request wrapper that overrides URI and servlet path to the rewritten value
     * while preserving all other request attributes.
     */
    private static class VersionRewriteRequestWrapper extends HttpServletRequestWrapper {

        private final String rewrittenUri;

        VersionRewriteRequestWrapper(HttpServletRequest request, String rewrittenUri) {
            super(request);
            this.rewrittenUri = rewrittenUri;
        }

        @Override
        public String getRequestURI() {
            return rewrittenUri;
        }

        @Override
        public String getServletPath() {
            return rewrittenUri;
        }
    }
}
