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
 * Adds security headers to every HTTP response:
 * <ul>
 *   <li>{@code Content-Security-Policy} — restricts resource loading origins</li>
 *   <li>{@code X-Content-Type-Options: nosniff} — prevents MIME-type sniffing</li>
 *   <li>{@code X-Frame-Options: DENY} — prevents clickjacking via iframes</li>
 * </ul>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class ContentSecurityPolicyFilter extends OncePerRequestFilter {

    private static final String CSP_HEADER = "Content-Security-Policy";
    private static final String CSP_VALUE =
            "default-src 'self'; "
            + "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            + "style-src 'self' 'unsafe-inline'; "
            + "img-src 'self' data: blob:; "
            + "font-src 'self' data:; "
            + "connect-src 'self' ws: wss:; "
            + "frame-ancestors 'none'";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        response.setHeader(CSP_HEADER, CSP_VALUE);
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");

        filterChain.doFilter(request, response);
    }
}
