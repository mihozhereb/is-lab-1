package ru.mihozhereb.api;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import ru.mihozhereb.domain.Address;
import ru.mihozhereb.domain.Coordinates;
import ru.mihozhereb.domain.Location;
import ru.mihozhereb.domain.Organization;
import ru.mihozhereb.domain.Person;
import ru.mihozhereb.domain.Product;
import ru.mihozhereb.repository.Repository;
import ru.mihozhereb.service.EntityService;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;


@Path("/{type: products|coordinates|organizations|persons|addresses|locations}")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EntityResource {
    private static final Map<String, Class<?>> TYPES = Map.of(
            "products", Product.class,
            "coordinates", Coordinates.class,
            "organizations", Organization.class,
            "persons", Person.class,
            "addresses", Address.class,
            "locations", Location.class);
    private static final Set<String> PAGING = Set.of("page", "size", "sort", "order");

    @Inject
    EntityService service;
    @PathParam("type")
    String type;

    @GET
    public Repository.Page<?> page(@QueryParam("page") @DefaultValue("1") int page,
                                   @QueryParam("size") @DefaultValue("10") int size,
                                   @QueryParam("sort") String sort,
                                   @QueryParam("order") @DefaultValue("asc") String order,
                                   @Context UriInfo uri) {
        Map<String, String> filters = new HashMap<>();
        uri.getQueryParameters().forEach((name, values) -> {
            if (!PAGING.contains(name) && !values.get(0).isEmpty()) {
                filters.put(name, values.get(0));
            }
        });
        return service.page(entityType(), page, size, sort, "desc".equalsIgnoreCase(order), filters);
    }

    @GET
    @Path("all")
    public List<?> all() {
        return service.all(entityType());
    }

    @GET
    @Path("{id: \\d+}")
    public Object get(@PathParam("id") long id) {
        return service.get(entityType(), id);
    }

    @POST
    public Response create(byte[] body) throws IOException {
        return Response.status(Response.Status.CREATED).entity(service.create(read(body))).build();
    }

    @PUT
    @Path("{id: \\d+}")
    public Object update(@PathParam("id") long id, byte[] body) throws IOException {
        return service.update(castType(), id, read(body));
    }

    @DELETE
    @Path("{id: \\d+}")
    public void delete(@PathParam("id") long id) {
        service.delete(entityType(), id);
    }

    private Class<?> entityType() {
        return TYPES.get(type);
    }

    @SuppressWarnings("unchecked")
    private Class<Object> castType() {
        return (Class<Object>) entityType();
    }

    private Object read(byte[] body) throws IOException {
        return body == null || body.length == 0 ? null : JsonConfig.MAPPER.readValue(body, entityType());
    }
}
