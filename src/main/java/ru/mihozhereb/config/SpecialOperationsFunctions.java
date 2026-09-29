package ru.mihozhereb.config;

import org.hibernate.boot.ResourceStreamLocator;
import org.hibernate.boot.model.relational.SimpleAuxiliaryDatabaseObject;
import org.hibernate.boot.spi.AdditionalMappingContributions;
import org.hibernate.boot.spi.AdditionalMappingContributor;
import org.hibernate.boot.spi.InFlightMetadataCollector;
import org.hibernate.boot.spi.MetadataBuildingContext;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

public class SpecialOperationsFunctions implements AdditionalMappingContributor {
    static final String SCRIPT = "db/special_operations.sql";

    @Override
    public String getContributorName() {
        return "islab-special-operations";
    }

    @Override
    public void contribute(AdditionalMappingContributions contributions, InFlightMetadataCollector metadata,
                           ResourceStreamLocator resourceStreamLocator, MetadataBuildingContext buildingContext) {
        contributions.contributeAuxiliaryDatabaseObject(new SimpleAuxiliaryDatabaseObject(
                metadata.getDatabase().getDefaultNamespace(),
                new String[]{readScript()},
                new String[0],
                Set.of()));
    }

    private static String readScript() {
        try (InputStream stream = SpecialOperationsFunctions.class.getClassLoader().getResourceAsStream(SCRIPT)) {
            if (stream == null) {
                throw new IllegalStateException("Не найден скрипт " + SCRIPT);
            }
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Не удалось прочитать " + SCRIPT, e);
        }
    }
}
