import com.github.gradle.node.npm.task.NpmTask

plugins {
    war
    id("com.github.node-gradle.node") version "7.1.0"
}

group = "ru.mihozhereb"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

val jakartaEeVersion = "11.0.0"
val hibernateVersion = "7.3.2.Final"
val hibernateValidatorVersion = "9.1.0.Final"
val jacksonVersion = "2.21.4"
val postgresqlVersion = "42.7.13"
val testcontainersVersion = "2.0.5"

dependencies {
    compileOnly("jakarta.platform:jakarta.jakartaee-api:$jakartaEeVersion")
    compileOnly("org.hibernate.orm:hibernate-core:$hibernateVersion")
    compileOnly("com.fasterxml.jackson.core:jackson-databind:$jacksonVersion")
    compileOnly("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:$jacksonVersion")

    testImplementation(platform("org.junit:junit-bom:5.14.4"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("org.hibernate.orm:hibernate-core:$hibernateVersion")
    testImplementation("com.fasterxml.jackson.core:jackson-databind:$jacksonVersion")
    testImplementation("jakarta.enterprise:jakarta.enterprise.cdi-api:4.1.0")
    testImplementation("jakarta.transaction:jakarta.transaction-api:2.0.1")
    testImplementation("org.hibernate.validator:hibernate-validator:$hibernateValidatorVersion")
    testImplementation("org.glassfish.expressly:expressly:6.0.0")
    testImplementation("org.postgresql:postgresql:$postgresqlVersion")
    testImplementation("org.testcontainers:testcontainers-postgresql:$testcontainersVersion")
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    options.release.set(17)
}

tasks.test {
    useJUnitPlatform()
    systemProperty("file.encoding", "UTF-8")
}

node {
    download.set(true)
    version.set("24.12.0")
    npmInstallCommand.set("ci")
    nodeProjectDir.set(file("frontend"))
}

val buildFrontend by tasks.registering(NpmTask::class) {
    description = "Собирает React-фронтенд в frontend/dist"
    dependsOn(tasks.npmInstall)
    args.set(listOf("run", "build"))
    inputs.dir("frontend/src")
    inputs.files(
        "frontend/package.json",
        "frontend/package-lock.json",
        "frontend/index.html",
        "frontend/vite.config.ts",
        "frontend/tsconfig.json",
    )
    outputs.dir("frontend/dist")
}

tasks.war {
    archiveFileName.set("islab.war")
    if (!project.hasProperty("skipFrontend")) {
        dependsOn(buildFrontend)
        from("frontend/dist")
    }
}
