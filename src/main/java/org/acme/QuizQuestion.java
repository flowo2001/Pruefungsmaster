package org.acme;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
    
    // Validierungsmethoden
    @JsonIgnore
    public boolean isValid() {
        if (question == null || question.isBlank()) return false;
        if (questionType == null || questionType.isBlank()) return false;
        if (category == null || category.isBlank()) return false;
        if (difficulty == null || difficulty.isBlank()) return false;
        
        return switch (questionType) {
            case "multiple-choice" -> isValidMultipleChoice();
            case "text" -> isValidTextQuestion();
            case "matching" -> isValidMatchingQuestion();
            default -> false;
        };
    }
    
    @JsonIgnore
    private boolean isValidMultipleChoice() {
        if (answers == null || answers.isEmpty()) return false;
        if (correctAnswerIndices == null || correctAnswerIndices.isEmpty()) return false;
        
        // Prüfe ob alle Antworten ausgefüllt sind
        for (String answer : answers) {
            if (answer == null || answer.isBlank()) return false;
        }
        
        // Prüfe ob Indices gültig sind
        for (Integer index : correctAnswerIndices) {
            if (index < 0 || index >= answers.size()) return false;
        }
        
        return true;
    }
    
    @JsonIgnore
    private boolean isValidTextQuestion() {
        return textAnswer != null && !textAnswer.isBlank();
    }
    
    @JsonIgnore
    private boolean isValidMatchingQuestion() {
        if (leftItems == null || leftItems.isEmpty()) return false;
        if (rightItems == null || rightItems.isEmpty()) return false;
        if (correctMappings == null || correctMappings.isEmpty()) return false;
        
        // Prüfe ob alle Items ausgefüllt sind
        for (String item : leftItems) {
            if (item == null || item.isBlank()) return false;
        }
        
        for (String item : rightItems) {
            if (item == null || item.isBlank()) return false;
        }
        
        // Prüfe ob Mappings gültig sind
        for (CategoryMapping mapping : correctMappings) {
            if (mapping.categoryIndex < 0 || mapping.categoryIndex >= rightItems.size()) return false;
            if (mapping.itemIndices == null || mapping.itemIndices.isEmpty()) return false;
            
            for (Integer itemIndex : mapping.itemIndices) {
                if (itemIndex < 0 || itemIndex >= leftItems.size()) return false;
            }
        }
        
        return true;
    }
    
    // Normalisiere Daten (setze nicht verwendete Felder auf null)
    public void normalizeData() {
        switch (questionType) {
            case "multiple-choice" -> {
                textAnswer = null;
                leftItems = null;
                rightItems = null;
                correctMappings = null;
            }
            case "text" -> {
                answers = null;
                correctAnswerIndices = null;
                leftItems = null;
                rightItems = null;
                correctMappings = null;
            }
            case "matching" -> {
                answers = null;
                correctAnswerIndices = null;
                textAnswer = null;
            }
        }
    }
}
