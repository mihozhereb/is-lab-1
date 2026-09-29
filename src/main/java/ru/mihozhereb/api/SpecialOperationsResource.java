package ru.mihozhereb.api;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import ru.mihozhereb.domain.Product;
import ru.mihozhereb.domain.UnitOfMeasure;
import ru.mihozhereb.service.SpecialOperationsService;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/special")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SpecialOperationsResource {
    public record PartNumber(String partNumber) {
    }

    public record Percent(BigDecimal percent) {
    }

    @Inject
    SpecialOperationsService service;

    @POST
    @Path("delete-by-part-number")
    public Map<String, Long> deleteByPartNumber(PartNumber input) {
        Map<String, Long> result = new HashMap<>();
        result.put("deletedId", service.deleteByPartNumber(input == null ? null : input.partNumber()));
        return result;
    }

    @GET
    @Path("min-coordinates")
    public Map<String, Product> minCoordinates() {
        Map<String, Product> result = new HashMap<>();
        result.put("product", service.withMinCoordinates());
        return result;
    }

    @GET
    @Path("owner-greater-than")
    public List<Product> ownerGreaterThan(@QueryParam("personId") Long personId) {
        return service.withOwnerGreaterThan(personId);
    }

    @GET
    @Path("by-units-of-measure")
    public List<Product> byUnitsOfMeasure(@QueryParam("units") List<UnitOfMeasure> units) {
        return service.byUnitsOfMeasure(units);
    }

    @POST
    @Path("decrease-prices")
    public Map<String, Integer> decreasePrices(Percent input) {
        return Map.of("updated", service.decreasePrices(input == null ? null : input.percent()));
    }
}
