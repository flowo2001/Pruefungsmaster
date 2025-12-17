package org.acme;

import java.net.URI;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Path("/")
public class RedirectResource {

    @GET
    public Response redirectToOverview() {
        return Response.seeOther(URI.create("/overview.html")).build();
    }
}
