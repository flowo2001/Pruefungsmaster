package org.acme;

import java.util.List;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "quizquestions")
public class QuizQuestion extends PanacheMongoEntity {
    
    public String question;
    public String questionType; // "multiple-choice", "text" oder "matching"
    public List<String> answers; // Nur für Multiple Choice
    public List<Integer> correctAnswerIndices; // Nur für Multiple Choice - mehrere richtige Antworten möglich
    public String textAnswer; // Nur für Texteingabe
    
    // Für Zuordnungsfragen
    public List<String> leftItems; // Items die zugeordnet werden sollen
    public List<String> rightItems; // Kategorien/Items zu denen zugeordnet wird
    public List<CategoryMapping> correctMappings; // Liste von Zuordnungen
    
    public String category;
    public String difficulty;

    // Hilfklasse für Zuordnungen
    public static class CategoryMapping {
        public Integer categoryIndex;
        public List<Integer> itemIndices;
        
        public CategoryMapping() {}
        
        public CategoryMapping(Integer categoryIndex, List<Integer> itemIndices) {
            this.categoryIndex = categoryIndex;
            this.itemIndices = itemIndices;
        }
    }

    // Konstruktoren
    public QuizQuestion() {
    }

    public QuizQuestion(String question, String questionType, List<String> answers, List<Integer> correctAnswerIndices, 
                       String textAnswer, List<String> leftItems, List<String> rightItems, 
                       List<CategoryMapping> correctMappings, String category, String difficulty) {
        this.question = question;
        this.questionType = questionType;
        this.answers = answers;
        this.correctAnswerIndices = correctAnswerIndices;
        this.textAnswer = textAnswer;
        this.leftItems = leftItems;
        this.rightItems = rightItems;
        this.correctMappings = correctMappings;
        this.category = category;
        this.difficulty = difficulty;
    }

    // Hilfsmethoden für Datenbankabfragen
    public static List<QuizQuestion> findByCategory(String category) {
        return list("category", category);
    }

    public static List<QuizQuestion> findByDifficulty(String difficulty) {
        return list("difficulty", difficulty);
    }
}
