package org.acme;

import java.util.List;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class QuizService {

    @Inject
    QuizQuestionRepository repository;

    /**
     * Erstelle eine neue Frage mit Validierung und Normalisierung
     */
    public QuizQuestion createQuestion(QuizQuestion question) {
        question.normalizeData();
        
        if (!question.isValid()) {
            throw new IllegalArgumentException("Ungültige Fragendaten");
        }
        
        repository.persist(question);
        return question;
    }

    /**
     * Aktualisiere eine Frage mit Validierung
     */
    public QuizQuestion updateQuestion(String id, QuizQuestion updatedQuestion) {
        QuizQuestion question = repository.findById(new ObjectId(id));
        if (question == null) {
            throw new IllegalArgumentException("Frage nicht gefunden");
        }
        
        updatedQuestion.normalizeData();
        
        if (!updatedQuestion.isValid()) {
            throw new IllegalArgumentException("Ungültige Fragendaten");
        }
        
        // Update Felder
        question.question = updatedQuestion.question;
        question.questionType = updatedQuestion.questionType;
        question.answers = updatedQuestion.answers;
        question.correctAnswerIndices = updatedQuestion.correctAnswerIndices;
        question.textAnswer = updatedQuestion.textAnswer;
        question.leftItems = updatedQuestion.leftItems;
        question.rightItems = updatedQuestion.rightItems;
        question.correctMappings = updatedQuestion.correctMappings;
        question.category = updatedQuestion.category;
        question.difficulty = updatedQuestion.difficulty;
        
        repository.update(question);
        return question;
    }

    /**
     * Hole alle Fragen mit Statistiken
     */
    public QuizStatistics getStatistics() {
        List<QuizQuestion> allQuestions = repository.listAll();
        
        long totalQuestions = allQuestions.size();
        long multipleChoice = allQuestions.stream()
            .filter(q -> "multiple-choice".equals(q.questionType))
            .count();
        long textQuestions = allQuestions.stream()
            .filter(q -> "text".equals(q.questionType))
            .count();
        long matchingQuestions = allQuestions.stream()
            .filter(q -> "matching".equals(q.questionType))
            .count();
        
        return new QuizStatistics(totalQuestions, multipleChoice, textQuestions, matchingQuestions);
    }

    /**
     * Filtere Fragen nach mehreren Kriterien
     */
    public List<QuizQuestion> filterQuestions(String type, String category, String difficulty) {
        List<QuizQuestion> questions = repository.listAll();
        
        return questions.stream()
            .filter(q -> type == null || type.equals(q.questionType))
            .filter(q -> category == null || category.equals(q.category))
            .filter(q -> difficulty == null || difficulty.equals(q.difficulty))
            .collect(Collectors.toList());
    }

    /**
     * Statistik-Klasse
     */
    public static class QuizStatistics {
        public long totalQuestions;
        public long multipleChoiceQuestions;
        public long textQuestions;
        public long matchingQuestions;

        public QuizStatistics(long total, long mc, long text, long matching) {
            this.totalQuestions = total;
            this.multipleChoiceQuestions = mc;
            this.textQuestions = text;
            this.matchingQuestions = matching;
        }
    }
}
