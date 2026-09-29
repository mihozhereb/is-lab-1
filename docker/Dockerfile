# Перед сборкой образа нужен WAR: ./gradlew war
FROM quay.io/wildfly/wildfly:40.0.1.Final-jdk17

ARG PG_JDBC_VERSION=42.7.13
ADD --chown=jboss:jboss https://repo1.maven.org/maven2/org/postgresql/postgresql/${PG_JDBC_VERSION}/postgresql-${PG_JDBC_VERSION}.jar /tmp/postgresql.jar
COPY --chown=jboss:jboss scripts/setup-wildfly.sh scripts/wildfly-datasource.cli /tmp/setup/

RUN sh /tmp/setup/setup-wildfly.sh /opt/jboss/wildfly /tmp/postgresql.jar \
    && rm -rf /tmp/setup /tmp/postgresql.jar \
        /opt/jboss/wildfly/standalone/configuration/standalone_xml_history \
        /opt/jboss/wildfly/standalone/data /opt/jboss/wildfly/standalone/log /opt/jboss/wildfly/standalone/tmp

COPY --chown=jboss:jboss build/libs/islab.war /opt/jboss/wildfly/standalone/deployments/islab.war
