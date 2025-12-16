package org.acme;

import java.util.List;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class QuizQuestionRepository implements PanacheMongoRepository<QuizQuestion> {

    public List<QuizQuestion> findByCategory(String category) {
        return list("category", category);
    }

    public List<QuizQuestion> findByDifficulty(String difficulty) {
        return list("difficulty", difficulty);
    }

    public List<QuizQuestion> findByCategoryAndDifficulty(String category, String difficulty) {
        return list("category = ?1 and difficulty = ?2", category, difficulty);
    }
}
