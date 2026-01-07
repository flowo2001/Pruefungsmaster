package org.acme;

import java.io.IOException;
import java.util.Objects;

import org.acme.AccessKey.KeyRole;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class ApiKeyFilter implements ContainerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";

    @Inject
    AccessKeyRepository accessKeyRepository;

    @ConfigProperty(name = "app.master-key", defaultValue = "")
    String masterKey;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        RequiredRole requiredRole = determineRequiredRole(requestContext);
        if (requiredRole == RequiredRole.NONE) {
            return;
        }

        String providedKey = requestContext.getHeaderString(API_KEY_HEADER);
        if (providedKey == null || providedKey.isBlank()) {
            abort(requestContext, Response.Status.UNAUTHORIZED, "Fehlender API-Schlüssel");
            return;
        }

        if (isMasterKey(providedKey)) {
            return;
        }

        var storedKey = accessKeyRepository.findByKey(providedKey)
            .orElse(null);

        if (storedKey == null) {
            abort(requestContext, Response.Status.UNAUTHORIZED, "Ungültiger API-Schlüssel");
            return;
        }

        if (!hasPermission(storedKey.role, requiredRole)) {
            abort(requestContext, Response.Status.FORBIDDEN, "Keine Berechtigung für diese Aktion");
        }
    }

    private boolean isMasterKey(String providedKey) {
        return masterKey != null && !masterKey.isBlank() && masterKey.equals(providedKey);
    }

    private RequiredRole determineRequiredRole(ContainerRequestContext ctx) {
        String path = ctx.getUriInfo().getPath();
        String method = ctx.getMethod();

        // Schutz für Key-Management
        if (path.startsWith("api/keys")) {
            return RequiredRole.KEY_MANAGER;
        }

        // Schutz für Quiz-API: alle Methoden brauchen mindestens USER, Schreiboperationen ADMIN
        if (path.startsWith("api/quiz")) {
            if (HttpMethod.POST.equals(method) || HttpMethod.PUT.equals(method) || HttpMethod.DELETE.equals(method)) {
                return RequiredRole.ADMIN;
            }
            return RequiredRole.USER;
        }

        return RequiredRole.NONE;
    }

    private void abort(ContainerRequestContext ctx, Response.Status status, String message) {
        ctx.abortWith(Response.status(status)
            .entity("{\"error\": \"" + message + "\"}")
            .build());
    }

    private enum RequiredRole {
        NONE,
        USER,
        ADMIN,
        KEY_MANAGER;

        KeyRole toKeyRole() {
            return switch (this) {
                case USER -> KeyRole.USER;
                case ADMIN -> KeyRole.ADMIN;
                case KEY_MANAGER -> KeyRole.KEY_MANAGER;
                default -> null;
            };
        }
    }

    private boolean hasPermission(KeyRole actual, RequiredRole required) {
        if (required == RequiredRole.NONE) return true;
        if (actual == null) return false;

        // Rechte-Hierarchie: ADMIN > KEY_MANAGER > USER
        return switch (required) {
            case USER -> (actual == KeyRole.USER || actual == KeyRole.ADMIN || actual == KeyRole.KEY_MANAGER);
            case ADMIN -> actual == KeyRole.ADMIN;
            case KEY_MANAGER -> actual == KeyRole.KEY_MANAGER;
            default -> false;
        };
    }
}