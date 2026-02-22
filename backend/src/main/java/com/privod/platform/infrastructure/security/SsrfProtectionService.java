package com.privod.platform.infrastructure.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

/**
 * Validates outbound URLs to prevent Server-Side Request Forgery (SSRF).
 * Blocks requests targeting private/reserved IP ranges, loopback, and link-local addresses.
 */
@Service
@Slf4j
public class SsrfProtectionService {

    /**
     * Validates a URL for safe external HTTP access.
     *
     * @param url the URL to validate
     * @throws IllegalArgumentException if the URL is null, malformed, or targets a private/reserved address
     */
    public void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("URL must not be null or blank");
        }

        URI uri;
        try {
            uri = URI.create(url.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Malformed URL: " + url, e);
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Only HTTP/HTTPS URLs are allowed, got: " + scheme);
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL must have a valid hostname: " + url);
        }

        // Block common internal hostnames
        String hostLower = host.toLowerCase();
        if (hostLower.equals("localhost")
                || hostLower.equals("host.docker.internal")
                || hostLower.endsWith(".internal")
                || hostLower.equals("metadata.google.internal")
                || hostLower.startsWith("169.254.169.254")) {
            throw new IllegalArgumentException("URL targets a restricted host: " + host);
        }

        // Resolve hostname and check IP ranges
        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress addr : addresses) {
                if (isReservedAddress(addr)) {
                    throw new IllegalArgumentException(
                            "URL resolves to a private/reserved IP address: " + host + " → " + addr.getHostAddress());
                }
            }
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Cannot resolve hostname: " + host, e);
        }

        log.debug("SSRF check passed for URL: {}", uri.getHost());
    }

    private boolean isReservedAddress(InetAddress addr) {
        return addr.isLoopbackAddress()        // 127.0.0.0/8, ::1
                || addr.isSiteLocalAddress()   // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
                || addr.isLinkLocalAddress()   // 169.254.0.0/16, fe80::/10
                || addr.isAnyLocalAddress()    // 0.0.0.0, ::
                || addr.isMulticastAddress();  // 224.0.0.0/4, ff00::/8
    }
}
