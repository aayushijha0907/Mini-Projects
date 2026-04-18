import java.util.*;

// Question Class
class Question {
    String question;
    String answer;
    String hint;
    String topic;

    Question(String q, String a, String h, String t) {
        this.question = q;
        this.answer = a;
        this.hint = h;
        this.topic = t;
    }
}

// AI Engine
class AIEngine {

    List<Question> questions = new ArrayList<>();
    Map<String, Integer> weakTopics = new HashMap<>();
    int score = 0;

    void addQuestion(Question q) {
        questions.add(q);
    }

    Question getNextQuestion() {
        // prioritize weak topics
        for (Question q : questions) {
            if (weakTopics.getOrDefault(q.topic, 0) > 1) {
                return q;
            }
        }
        return questions.get(new Random().nextInt(questions.size()));
    }

    void evaluateAnswer(Question q, String userAnswer) {
        userAnswer = userAnswer.toLowerCase();

        if (userAnswer.contains(q.answer.toLowerCase())) {
            System.out.println("✅ Correct!");
            score++;
        } else {
            System.out.println("❌ Incorrect!");
            System.out.println("💡 Hint: " + q.hint);

            weakTopics.put(q.topic, weakTopics.getOrDefault(q.topic, 0) + 1);
        }
    }

    void showWeakTopics() {
        System.out.println("\n📉 Weak Topics:");
        for (String topic : weakTopics.keySet()) {
            System.out.println(topic + " → mistakes: " + weakTopics.get(topic));
        }
    }
}

// Main Class
public class OfflineInterviewPrep {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);
        AIEngine ai = new AIEngine();

        // Add questions
        ai.addQuestion(new Question(
                "What is time complexity of binary search?",
                "log",
                "Divide into halves",
                "Searching"
        ));

        ai.addQuestion(new Question(
                "Which data structure uses FIFO?",
                "queue",
                "Think line",
                "Data Structures"
        ));

        ai.addQuestion(new Question(
                "Time complexity of bubble sort?",
                "n^2",
                "Nested loops",
                "Sorting"
        ));

        while (true) {
            System.out.println("\n===== MENU =====");
            System.out.println("1. Start Quiz");
            System.out.println("2. View Weak Topics");
            System.out.println("3. Exit");

            int choice = sc.nextInt();
            sc.nextLine(); // clear buffer

            if (choice == 1) {
                Question q = ai.getNextQuestion();

                System.out.println("\nQuestion: " + q.question);
                System.out.print("Your Answer: ");
                String userAns = sc.nextLine();

                ai.evaluateAnswer(q, userAns);

                System.out.println("Score: " + ai.score);

            } else if (choice == 2) {
                ai.showWeakTopics();

            } else if (choice == 3) {
                System.out.println("Exiting...");
                break;
            }
        }
    }
}
