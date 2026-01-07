package org.acme;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.acme.AccessKey.KeyRole;

import jakarta.inject.Inject;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/keys")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AccessKeyResource {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final HexFormat HEX = HexFormat.of();

    @Inject
    AccessKeyRepository repository;

    @GET
    public List<KeyView> list() {
        return repository.listAll().stream()
            .map(KeyView::from)
            .toList();
    }

    @POST
    public Response create(CreateKeyRequest request) {
        if (request == null || request.role == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Rolle wird benötigt"))
                .build();
        }

        AccessKey key = new AccessKey();
        key.key = generateKey();
        key.role = request.role;
        key.label = request.label;
        key.userId = UUID.randomUUID().toString();
        key.displayName = request.displayName;

        repository.persist(key);

        return Response.status(Response.Status.CREATED)
            .entity(new CreatedKeyResponse(key.id.toString(), key.key, key.role, key.label, key.userId, key.displayName))
            .build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") String id) {
        org.bson.types.ObjectId objectId;
        try {
            objectId = new org.bson.types.ObjectId(id);
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Ungültige ID"))
                .build();
        }

        boolean deleted = repository.deleteById(objectId);
        if (!deleted) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Key nicht gefunden"))
                .build();
        }
        return Response.noContent().build();
    }

    private String generateKey() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HEX.formatHex(bytes);
    }

    public static class CreateKeyRequest {
        public KeyRole role;
        public String label;
        public String displayName;
    }

    public record KeyView(String id, String role, String label, String createdAt, String maskedKey, String userId, String displayName) {
        static KeyView from(AccessKey key) {
            String masked = key.key != null && key.key.length() > 6
                ? "***" + key.key.substring(key.key.length() - 6)
                : "***";
            return new KeyView(key.id.toString(), key.role.name(), key.label, key.createdAt.toString(), masked, key.userId, key.displayName);
        }
    }

    public record CreatedKeyResponse(String id, String key, KeyRole role, String label, String userId, String displayName) { }
}