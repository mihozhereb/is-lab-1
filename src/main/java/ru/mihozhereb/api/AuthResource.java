package ru.mihozhereb.api;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import ru.mihozhereb.service.AppException;
import ru.mihozhereb.service.AuthService;

import java.util.Map;

@Path("/auth")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {
    public record Credentials(String username, String password) {
    }

    @Inject
    AuthService authService;
    @Context
    HttpServletRequest request;

    @POST
    @Path("register")
    public Map<String, String> register(Credentials credentials) {
        Credentials c = credentials == null ? new Credentials(null, null) : credentials;
        return signIn(authService.register(c.username(), c.password()));
    }

    @POST
    @Path("login")
    public Map<String, String> login(Credentials credentials) {
        Credentials c = credentials == null ? new Credentials(null, null) : credentials;
        return signIn(authService.login(c.username(), c.password()));
    }

    @POST
    @Path("logout")
    public void logout() {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    @GET
    @Path("me")
    public Map<String, String> me() {
        HttpSession session = request.getSession(false);
        Object username = session == null ? null : session.getAttribute(AuthService.SESSION_USER);
        if (username == null) {
            throw AppException.unauthorized("Войдите в систему");
        }
        return Map.of("username", (String) username);
    }

    private Map<String, String> signIn(String username) {
        request.getSession(true);
        request.changeSessionId(); // защита от фиксации сессии
        request.getSession().setAttribute(AuthService.SESSION_USER, username);
        return Map.of("username", username);
    }
}
