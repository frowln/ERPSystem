package com.privod.platform.modules.kep.service;

import java.time.Instant;

/**
 * Abstraction over cryptographic operations for KEP (Qualified Electronic Signature).
 * <p>
 * Supports PKCS#7 CAdES-BES signing/verification, X.509 certificate parsing,
 * OCSP revocation checking, and RFC 3161 timestamping.
 */
public interface CryptoProviderService {

    /**
     * Create a PKCS#7 CAdES-BES detached signature.
     *
     * @param data             the data to sign
     * @param certificateBytes DER/PEM-encoded signing certificate
     * @param privateKeyHint   optional private key bytes (may be null if HSM/token is used)
     * @return detached PKCS#7 signature bytes
     */
    byte[] sign(byte[] data, byte[] certificateBytes, byte[] privateKeyHint);

    /**
     * Verify a PKCS#7 detached signature.
     *
     * @param data           the original data that was signed
     * @param signatureBytes the PKCS#7 signature bytes
     * @return true if signature is valid
     */
    boolean verify(byte[] data, byte[] signatureBytes);

    /**
     * Parse an X.509 certificate and extract subject/issuer information.
     *
     * @param certificateBytes DER or PEM-encoded certificate
     * @return parsed certificate info
     */
    CertificateInfo parseCertificate(byte[] certificateBytes);

    /**
     * Check certificate revocation status via OCSP.
     *
     * @param certificateBytes DER or PEM-encoded certificate
     * @return OCSP check result
     */
    OcspResult checkOcsp(byte[] certificateBytes);

    /**
     * Obtain an RFC 3161 timestamp for a signature.
     *
     * @param signatureBytes the signature bytes to timestamp
     * @param tsaUrl         the Timestamp Authority URL
     * @return timestamp token bytes
     */
    byte[] timestamp(byte[] signatureBytes, String tsaUrl);

    // ===================== Inner records =====================

    /**
     * Parsed X.509 certificate information with Russian-specific OIDs
     * (INN — OID 1.2.643.3.131.1.1, OGRN — OID 1.2.643.100.1).
     */
    record CertificateInfo(
            String subjectCN,
            String subjectOrg,
            String subjectINN,
            String subjectOGRN,
            String issuer,
            String serialNumber,
            Instant validFrom,
            Instant validTo,
            String thumbprint
    ) {
    }

    /**
     * Result of an OCSP revocation check.
     */
    record OcspResult(
            OcspStatus status,
            Instant checkedAt,
            String responderUrl,
            String message
    ) {
    }

    /**
     * OCSP certificate status.
     */
    enum OcspStatus {
        GOOD,
        REVOKED,
        UNKNOWN,
        ERROR
    }
}
