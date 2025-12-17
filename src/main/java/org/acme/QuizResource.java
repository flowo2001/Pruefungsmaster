package org.acme;

import java.util.List;

import org.bson.types.ObjectId;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/quiz")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class QuizResource {

    @Inject
    QuizQuestionRepository repository;
    
    @Inject
    QuizService quizService;

    @GET
    public List<QuizQuestion> getAllQuestions() {
        return repository.listAll();
    }

    @GET
    @Path("/{id}")
    public Response getQuestionById(@PathParam("id") String id) {
        QuizQuestion question = repository.findById(new ObjectId(id));
        if (question == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(question).build();
    }

    @GET
    @Path("/category/{category}")
    public List<QuizQuestion> getQuestionsByCategory(@PathParam("category") String category) {
        return repository.findByCategory(category);
    }

    @GET
    @Path("/difficulty/{difficulty}")
    public List<QuizQuestion> getQuestionsByDifficulty(@PathParam("difficulty") String difficulty) {
        return repository.findByDifficulty(difficulty);
    }

    @POST
    public Response createQuestion(QuizQuestion question) {
        try {
            QuizQuestion created = quizService.createQuestion(question);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("{\"error\": \"" + e.getMessage() + "\"}")
                .build();
        }
    }

    @PUT
    @Path("/{id}")
    public Response updateQuestion(@PathParam("id") String id, QuizQuestion updatedQuestion) {
        try {
            QuizQuestion updated = quizService.updateQuestion(id, updatedQuestion);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("nicht gefunden")) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
            }
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("{\"error\": \"" + e.getMessage() + "\"}")
                .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response deleteQuestion(@PathParam("id") String id) {
        QuizQuestion question = repository.findById(new ObjectId(id));
        if (question == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        repository.delete(question);
        return Response.noContent().build();
    }

    @GET
    @Path("/random")
    public Response getRandomQuestion(
            @QueryParam("category") String category,
            @QueryParam("difficulty") String difficulty) {
        
        List<QuizQuestion> questions;
        
        if (category != null && difficulty != null) {
            questions = repository.findByCategoryAndDifficulty(category, difficulty);
        } else if (category != null) {
            questions = repository.findByCategory(category);
        } else if (difficulty != null) {
            questions = repository.findByDifficulty(difficulty);
        } else {
            questions = repository.listAll();
        }
        
        if (questions.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        int randomIndex = (int) (Math.random() * questions.size());
        return Response.ok(questions.get(randomIndex)).build();
    }
    
    @GET
    @Path("/statistics")
    public Response getStatistics() {
        return Response.ok(quizService.getStatistics()).build();
    }
    
    @GET
    @Path("/filter")
    public Response filterQuestions(
            @QueryParam("type") String type,
            @QueryParam("category") String category,
            @QueryParam("difficulty") String difficulty) {
        List<QuizQuestion> filtered = quizService.filterQuestions(type, category, difficulty);
        return Response.ok(filtered).build();
    }
}
