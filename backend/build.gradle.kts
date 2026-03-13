plugins {
    java
    id("org.springframework.boot") version "3.4.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.privod"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

val mapstructVersion = "1.6.3"
val jjwtVersion = "0.12.6"
val testcontainersVersion = "1.20.4"
val springdocVersion = "2.8.0"

val financeGateSourceSet = sourceSets.create("financeGateTest") {
    java.srcDir("src/test/java")
    java.include(
        "com/privod/platform/modules/commercialProposal/service/CommercialProposalServiceTest.java",
        "com/privod/platform/modules/finance/service/InvoiceMatchingServiceTest.java",
        "com/privod/platform/modules/contract/service/ContractBudgetItemServiceTest.java",
    )
    resources.srcDir("src/test/resources")

    compileClasspath += sourceSets["main"].output + configurations["testCompileClasspath"]
    runtimeClasspath += output + compileClasspath + configurations["testRuntimeClasspath"]
}

configurations[financeGateSourceSet.implementationConfigurationName].extendsFrom(configurations["testImplementation"])
configurations[financeGateSourceSet.compileOnlyConfigurationName].extendsFrom(configurations["testCompileOnly"])
configurations[financeGateSourceSet.runtimeOnlyConfigurationName].extendsFrom(configurations["testRuntimeOnly"])
configurations[financeGateSourceSet.annotationProcessorConfigurationName].extendsFrom(configurations["testAnnotationProcessor"])

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-mail")

    // PDF Generation (Flying Saucer + OpenPDF)
    implementation("org.xhtmlrenderer:flying-saucer-pdf-openpdf:9.3.0")

    // XLSX Generation (Apache POI)
    implementation("org.apache.poi:poi-ooxml:5.2.5")

    // Database
    runtimeOnly("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:$jjwtVersion")

    // Jackson
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // MapStruct
    implementation("org.mapstruct:mapstruct:$mapstructVersion")
    annotationProcessor("org.mapstruct:mapstruct-processor:$mapstructVersion")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok-mapstruct-binding:0.2.0")

    // AWS S3 SDK (S3StorageService + StorageConfig)
    implementation(platform("software.amazon.awssdk:bom:2.25.0"))
    implementation("software.amazon.awssdk:s3")

    // Apache Tika (FileValidationService — MIME type detection)
    implementation("org.apache.tika:tika-core:2.9.1")

    // Apache PDFBox (SpecificationPdfParserService — PDF text extraction)
    implementation("org.apache.pdfbox:pdfbox:3.0.2")

    // Redis (RedisWebSocketBroadcast — optional at runtime)
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // OpenAPI / Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:$springdocVersion")

    // Sentry error tracking
    implementation("io.sentry:sentry-spring-boot-starter-jakarta:7.14.0")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:postgresql:$testcontainersVersion")
    testImplementation("org.testcontainers:junit-jupiter:$testcontainersVersion")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")
    add(financeGateSourceSet.runtimeOnlyConfigurationName, "org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile> {
    options.compilerArgs.addAll(listOf(
        "-Amapstruct.defaultComponentModel=spring",
        "-Amapstruct.unmappedTargetPolicy=IGNORE"
    ))
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.register<Test>("financeGateTest") {
    description = "Runs isolated finance regression tests without compiling legacy test tree."
    group = "verification"
    testClassesDirs = financeGateSourceSet.output.classesDirs
    classpath = financeGateSourceSet.runtimeClasspath
    useJUnitPlatform()
}
