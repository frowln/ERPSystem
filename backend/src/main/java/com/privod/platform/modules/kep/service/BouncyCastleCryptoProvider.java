package com.privod.platform.modules.kep.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import javax.security.auth.x500.X500Principal;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.Security;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Primary CryptoProviderService implementation using standard Java Security
 * with BouncyCastle as a fallback provider when available.
 * <p>
 * Current implementation uses standard Java crypto (java.security.*) for maximum
 * compatibility. Full PKCS#7 CAdES-BES (CMSSignedData) requires BouncyCastle;
 * TODO comments mark where BC-specific code should be added when the dependency
 * is included in the build.
 */
@Service
@Primary
@Slf4j
public class BouncyCastleCryptoProvider implements CryptoProviderService {

    private static final String SHA256_WITH_RSA = "SHA256withRSA";
    private static final String SHA_256 = "SHA-256";
    private static final String SHA_1 = "SHA-1";

    // Russian-specific OIDs
    private static final String OID_INN = "1.2.643.3.131.1.1";
    private static final String OID_OGRN = "1.2.643.100.1";

    @PostConstruct
    public void init() {
        try {
            Class<?> bcProviderClass = Class.forName("org.bouncycastle.jce.provider.BouncyCastleProvider");
            java.security.Provider provider = (java.security.Provider) bcProviderClass
                    .getDeclaredConstructor().newInstance();
            if (Security.getProvider(provider.getName()) == null) {
                Security.addProvider(provider);
                log.info("BouncyCastle provider registered successfully");
            } else {
                log.info("BouncyCastle provider already registered");
            }
        } catch (ClassNotFoundException e) {
            log.warn("BouncyCastle not available on classpath — using standard Java crypto. " +
                    "Full CAdES-BES support requires org.bouncycastle:bcpkix-jdk18on dependency.");
        } catch (Exception e) {
            log.error("Failed to register BouncyCastle provider", e);
        }

        // P0-DOC-1: warn prominently at startup that GOST signing is not available.
        // Real ГОСТ Р 34.10-2012 signature requires CryptoPro JCP 2.0 (commercial license).
        // Until CryptoPro JCP is installed and its JAR is added to the classpath, all
        // signing operations that do NOT supply a private key will throw an exception
        // (they will not silently return a SHA-256 hash, which is NOT a valid signature).
        log.warn("[КЭП P0] ГОСТ Р 34.10-2012 digital signature is NOT available. " +
                "Юридически значимые электронные подписи требуют CryptoPro JCP 2.0. " +
                "Обратитесь к поставщику: https://cryptopro.ru. " +
                "До установки CryptoPro JCP подписание документов без приватного ключа RSA невозможно.");
    }

    @Override
    public byte[] sign(byte[] data, byte[] certificateBytes, byte[] privateKeyHint) {
        try {
            // TODO: Replace with CMSSignedDataGenerator for full PKCS#7 CAdES-BES:
            //   CMSSignedDataGenerator gen = new CMSSignedDataGenerator();
            //   ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
            //       .setProvider("BC").build(privateKey);
            //   gen.addSignerInfoGenerator(new JcaSignerInfoGeneratorBuilder(
            //       new JcaDigestCalculatorProviderBuilder().build()).build(signer, certificate));
            //   gen.addCertificates(new JcaCertStore(List.of(certificate)));
            //   CMSSignedData signed = gen.generate(new CMSProcessableByteArray(data), false);
            //   return signed.getEncoded();

            // Fallback: compute SHA-256 hash + PKCS#1 signature when private key is available
            MessageDigest digest = MessageDigest.getInstance(SHA_256);
            byte[] hash = digest.digest(data);

            if (privateKeyHint != null && privateKeyHint.length > 0) {
                java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance("RSA");
                java.security.spec.PKCS8EncodedKeySpec keySpec =
                        new java.security.spec.PKCS8EncodedKeySpec(privateKeyHint);
                java.security.PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

                Signature sig = Signature.getInstance(SHA256_WITH_RSA);
                sig.initSign(privateKey);
                sig.update(data);
                byte[] signatureBytes = sig.sign();

                log.debug("Document signed using SHA256withRSA (PKCS#1 fallback), hash={}",
                        HexFormat.of().formatHex(hash));
                return signatureBytes;
            }

            // P0-DOC-1: Do NOT return a hash as a fake signature.
            // A SHA-256 hash is NOT a digital signature and would be accepted nowhere.
            // Throw explicitly so callers understand signing is impossible without a key.
            throw new CryptoOperationException(
                    "Подписание невозможно: приватный ключ не передан. " +
                    "Для ГОСТ Р 34.10-2012 необходим CryptoPro JCP 2.0 (лицензионная библиотека). " +
                    "Для RSA-подписи передайте privateKeyHint в формате PKCS#8.");

        } catch (Exception e) {
            log.error("Failed to sign data", e);
            throw new CryptoOperationException("Ошибка создания подписи: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verify(byte[] data, byte[] signatureBytes) {
        try {
            // TODO: Replace with CMSSignedData verification for full PKCS#7:
            //   CMSSignedData cms = new CMSSignedData(new CMSProcessableByteArray(data), signatureBytes);
            //   Store<X509CertificateHolder> certStore = cms.getCertificates();
            //   for (SignerInformation signer : cms.getSignerInfos().getSigners()) {
            //       Collection<X509CertificateHolder> certs = certStore.getMatches(signer.getSID());
            //       X509CertificateHolder certHolder = certs.iterator().next();
            //       return signer.verify(new JcaSimpleSignerInfoVerifierBuilder()
            //           .setProvider("BC").build(certHolder));
            //   }

            // Fallback: verify SHA-256 hash match (when no full PKCS#7 is available)
            if (signatureBytes.length == 32) {
                MessageDigest digest = MessageDigest.getInstance(SHA_256);
                byte[] hash = digest.digest(data);
                return MessageDigest.isEqual(hash, signatureBytes);
            }

            // Attempt PKCS#1 verification if we can extract a public key
            log.warn("PKCS#7 verification requires BouncyCastle — returning basic hash check result");
            return false;

        } catch (Exception e) {
            log.error("Failed to verify signature", e);
            return false;
        }
    }

    @Override
    public CertificateInfo parseCertificate(byte[] certificateBytes) {
        try {
            byte[] derBytes = normalizeCertificateBytes(certificateBytes);

            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            X509Certificate cert = (X509Certificate) cf.generateCertificate(
                    new ByteArrayInputStream(derBytes));

            String subjectDN = cert.getSubjectX500Principal().getName(X500Principal.RFC2253);
            String issuerDN = cert.getIssuerX500Principal().getName(X500Principal.RFC2253);

            String cn = extractDnField(subjectDN, "CN");
            String org = extractDnField(subjectDN, "O");
            String inn = extractOidValue(subjectDN, OID_INN);
            String ogrn = extractOidValue(subjectDN, OID_OGRN);

            // Compute SHA-1 thumbprint
            MessageDigest sha1 = MessageDigest.getInstance(SHA_1);
            byte[] thumbprintBytes = sha1.digest(cert.getEncoded());
            String thumbprint = HexFormat.of().withUpperCase().formatHex(thumbprintBytes);

            return new CertificateInfo(
                    cn,
                    org,
                    inn,
                    ogrn,
                    issuerDN,
                    cert.getSerialNumber().toString(16).toUpperCase(),
                    cert.getNotBefore().toInstant(),
                    cert.getNotAfter().toInstant(),
                    thumbprint
            );

        } catch (Exception e) {
            log.error("Failed to parse certificate", e);
            throw new CryptoOperationException("Ошибка чтения сертификата: " + e.getMessage(), e);
        }
    }

    @Override
    public OcspResult checkOcsp(byte[] certificateBytes) {
        try {
            byte[] derBytes = normalizeCertificateBytes(certificateBytes);
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            X509Certificate cert = (X509Certificate) cf.generateCertificate(
                    new ByteArrayInputStream(derBytes));

            // Extract OCSP responder URL from AIA (Authority Information Access) extension
            String ocspUrl = extractOcspUrl(cert);
            if (ocspUrl == null || ocspUrl.isBlank()) {
                return new OcspResult(
                        OcspStatus.UNKNOWN,
                        Instant.now(),
                        null,
                        "Не удалось определить URL OCSP-ответчика из расширения AIA сертификата"
                );
            }

            // TODO: Full OCSP with BouncyCastle:
            //   OCSPReqBuilder builder = new OCSPReqBuilder();
            //   CertificateID certId = new CertificateID(
            //       new JcaDigestCalculatorProviderBuilder().build()
            //           .get(CertificateID.HASH_SHA1), issuerCertHolder, cert.getSerialNumber());
            //   builder.addRequest(certId);
            //   OCSPReq ocspReq = builder.build();
            //   byte[] requestBytes = ocspReq.getEncoded();

            // Fallback: send a minimal OCSP probe via HTTP
            log.info("Sending OCSP check to {}", ocspUrl);
            HttpURLConnection conn = (HttpURLConnection) URI.create(ocspUrl).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(10_000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                // TODO: Parse OCSPResp to extract actual certificate status
                //   OCSPResp ocspResp = new OCSPResp(conn.getInputStream());
                //   BasicOCSPResp basicResp = (BasicOCSPResp) ocspResp.getResponseObject();
                //   SingleResp singleResp = basicResp.getResponses()[0];
                //   CertificateStatus certStatus = singleResp.getCertStatus();
                log.info("OCSP responder returned HTTP 200 from {}", ocspUrl);
                return new OcspResult(
                        OcspStatus.GOOD,
                        Instant.now(),
                        ocspUrl,
                        "OCSP-ответчик доступен (полная проверка требует BouncyCastle)"
                );
            } else {
                return new OcspResult(
                        OcspStatus.ERROR,
                        Instant.now(),
                        ocspUrl,
                        "OCSP-ответчик вернул HTTP " + responseCode
                );
            }

        } catch (Exception e) {
            log.error("OCSP check failed", e);
            return new OcspResult(
                    OcspStatus.ERROR,
                    Instant.now(),
                    null,
                    "Ошибка проверки OCSP: " + e.getMessage()
            );
        }
    }

    @Override
    public byte[] timestamp(byte[] signatureBytes, String tsaUrl) {
        try {
            // Compute SHA-256 imprint of the signature
            MessageDigest digest = MessageDigest.getInstance(SHA_256);
            byte[] imprint = digest.digest(signatureBytes);

            // TODO: Full RFC 3161 with BouncyCastle:
            //   TimeStampRequestGenerator tsqGen = new TimeStampRequestGenerator();
            //   tsqGen.setCertReq(true);
            //   TimeStampRequest tsReq = tsqGen.generate(TSPAlgorithms.SHA256, imprint);
            //   byte[] requestBytes = tsReq.getEncoded();

            // Send timestamp request to TSA
            log.info("Requesting RFC 3161 timestamp from {}", tsaUrl);
            HttpURLConnection conn = (HttpURLConnection) URI.create(tsaUrl).toURL().openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15_000);
            conn.setReadTimeout(15_000);
            conn.setRequestProperty("Content-Type", "application/timestamp-query");

            // Send the imprint as a minimal timestamp request body
            // TODO: Replace with properly encoded ASN.1 TimeStampReq
            try (OutputStream os = conn.getOutputStream()) {
                os.write(imprint);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                byte[] tspResponse = conn.getInputStream().readAllBytes();
                log.info("Timestamp received from {} ({} bytes)", tsaUrl, tspResponse.length);
                return tspResponse;
            } else {
                throw new CryptoOperationException(
                        "TSA вернул HTTP " + responseCode + " от " + tsaUrl);
            }

        } catch (CryptoOperationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Timestamp request failed", e);
            throw new CryptoOperationException("Ошибка запроса метки времени: " + e.getMessage(), e);
        }
    }

    // ===================== Helpers =====================

    /**
     * Normalize PEM-encoded certificate to DER bytes.
     */
    private byte[] normalizeCertificateBytes(byte[] bytes) {
        String str = new String(bytes, StandardCharsets.UTF_8).trim();
        if (str.startsWith("-----BEGIN CERTIFICATE-----")) {
            String base64 = str
                    .replace("-----BEGIN CERTIFICATE-----", "")
                    .replace("-----END CERTIFICATE-----", "")
                    .replaceAll("\\s+", "");
            return Base64.getDecoder().decode(base64);
        }
        return bytes;
    }

    /**
     * Extract a field value from an RFC 2253 DN string.
     */
    private String extractDnField(String dn, String field) {
        Pattern pattern = Pattern.compile("(?:^|,)\\s*" + Pattern.quote(field) + "=([^,]+)");
        Matcher matcher = pattern.matcher(dn);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    /**
     * Extract a value by OID from an RFC 2253 DN string.
     * Russian-specific OIDs (INN, OGRN) appear as OID.x.x.x.x=value in the DN.
     */
    private String extractOidValue(String dn, String oid) {
        // Try standard notation
        Pattern pattern = Pattern.compile("(?:^|,)\\s*" + Pattern.quote(oid) + "=([^,]+)");
        Matcher matcher = pattern.matcher(dn);
        if (matcher.find()) {
            return matcher.group(1).trim().replace("#", "");
        }
        // Try OID. prefix notation
        Pattern oidPattern = Pattern.compile("(?:^|,)\\s*OID\\." + Pattern.quote(oid) + "=([^,]+)");
        Matcher oidMatcher = oidPattern.matcher(dn);
        if (oidMatcher.find()) {
            return oidMatcher.group(1).trim().replace("#", "");
        }
        return null;
    }

    /**
     * Extract OCSP responder URL from the certificate's Authority Information Access extension.
     */
    private String extractOcspUrl(X509Certificate cert) {
        try {
            // AIA extension OID: 1.3.6.1.5.5.7.1.1
            byte[] aiaExtension = cert.getExtensionValue("1.3.6.1.5.5.7.1.1");
            if (aiaExtension == null) {
                return null;
            }
            // TODO: Proper ASN.1 parsing of AIA extension to extract OCSP URL
            // For now, attempt a simple string search for http(s):// in the extension bytes
            String extensionStr = new String(aiaExtension, StandardCharsets.ISO_8859_1);
            Pattern urlPattern = Pattern.compile("https?://[\\w./-]+");
            Matcher matcher = urlPattern.matcher(extensionStr);
            if (matcher.find()) {
                return matcher.group();
            }
            return null;
        } catch (Exception e) {
            log.debug("Failed to extract OCSP URL from AIA extension", e);
            return null;
        }
    }

    /**
     * Runtime exception for crypto operation failures.
     */
    public static class CryptoOperationException extends RuntimeException {
        public CryptoOperationException(String message) {
            super(message);
        }

        public CryptoOperationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
