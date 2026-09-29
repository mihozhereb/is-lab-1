package ru.mihozhereb.api;

import jakarta.annotation.Priority;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.ext.Provider;
import ru.mihozhereb.service.AppException;
import ru.mihozhereb.service.AuthService;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {
    @Context
    HttpServletRequest request;

    @Override
    public void filter(ContainerRequestContext context) {
        if (context.getUriInfo().getPath().replaceFirst("^/", "").startsWith("auth/")) {
            return;
        }
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute(AuthService.SESSION_USER) == null) {
            context.abortWith(ErrorMapper.toResponse(AppException.unauthorized("Войдите в систему")));
        }
    }
}
