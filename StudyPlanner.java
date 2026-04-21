import java.util.*;

class Task {
    String title;
    String subject;
    String priority;
    String deadline;
    boolean completed;

    public Task(String title, String subject, String priority, String deadline) {
        this.title = title;
        this.subject = subject;
        this.priority = priority;
        this.deadline = deadline;
        this.completed = false;
    }

    public void display(int index) {
        System.out.println(index + ". " + title + " | " + subject + " | " + priority +
                " | Deadline: " + deadline + " | " + (completed ? "Done" : "Pending"));
    }
}

public class StudyPlanner {

    static ArrayList<Task> tasks = new ArrayList<>();
    static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {

        while (true) {
            System.out.println("\n===== STUDY PLANNER =====");
            System.out.println("1. Add Task");
            System.out.println("2. Remove Task");
            System.out.println("3. Edit Task");
            System.out.println("4. Mark Completed");
            System.out.println("5. View Tasks");
            System.out.println("6. Sort by Subject");
            System.out.println("7. Progress Dashboard");
            System.out.println("8. Study Timer");
            System.out.println("9. Search Task");
            System.out.println("10. Deadline Check");
            System.out.println("0. Exit");

            int choice = sc.nextInt();
            sc.nextLine(); // FIX for input issue

            switch (choice) {
                case 1:
                    addTask();
                    break;
                case 2:
                    removeTask();
                    break;
                case 3:
                    editTask();
                    break;
                case 4:
                    markCompleted();
                    break;
                case 5:
                    viewTasks();
                    break;
                case 6:
                    sortBySubject();
                    break;
                case 7:
                    showProgress();
                    break;
                case 8:
                    studyTimer();
                    break;
                case 9:
                    searchTask();
                    break;
                case 10:
                    checkDeadlines();
                    break;
                case 0:
                    System.out.println("Exiting...");
                    return;
                default:
                    System.out.println("Invalid choice");
            }
        }
    }

    static void addTask() {
        System.out.print("Title: ");
        String title = sc.nextLine();

        System.out.print("Subject: ");
        String subject = sc.nextLine();

        System.out.print("Priority (High/Medium/Low): ");
        String priority = sc.nextLine();

        System.out.print("Deadline (DD-MM): ");
        String deadline = sc.nextLine();

        tasks.add(new Task(title, subject, priority, deadline));
        System.out.println("Task Added!");
    }

    static void removeTask() {
        viewTasks();
        System.out.print("Enter task number to remove: ");
        int i = sc.nextInt();
        sc.nextLine();
        tasks.remove(i - 1);
        System.out.println("Removed!");
    }

    static void editTask() {
        viewTasks();
        System.out.print("Enter task number to edit: ");
        int i = sc.nextInt();
        sc.nextLine();

        Task t = tasks.get(i - 1);

        System.out.print("New Title: ");
        t.title = sc.nextLine();

        System.out.print("New Subject: ");
        t.subject = sc.nextLine();

        System.out.print("New Priority: ");
        t.priority = sc.nextLine();

        System.out.print("New Deadline: ");
        t.deadline = sc.nextLine();

        System.out.println("Updated!");
    }

    static void markCompleted() {
        viewTasks();
        System.out.print("Enter task number: ");
        int i = sc.nextInt();
        sc.nextLine();
        tasks.get(i - 1).completed = true;
        System.out.println("Marked as done!");
    }

    static void viewTasks() {
        if (tasks.isEmpty()) {
            System.out.println("No tasks.");
            return;
        }
        int i = 1;
        for (Task t : tasks) {
            t.display(i++);
        }
    }

    static void sortBySubject() {
        tasks.sort(Comparator.comparing(t -> t.subject));
        System.out.println("Sorted by subject!");
    }

    static void showProgress() {
        int total = tasks.size();
        int done = 0;

        for (Task t : tasks) {
            if (t.completed) done++;
        }

        System.out.println("Total: " + total);
        System.out.println("Completed: " + done);
        System.out.println("Pending: " + (total - done));
    }

    static void studyTimer() {
        System.out.print("Enter minutes: ");
        int min = sc.nextInt();
        sc.nextLine();

        try {
            System.out.println("Timer started...");
            Thread.sleep(min * 60 * 1000);
            System.out.println("Time's up! Take a break.");
        } catch (InterruptedException e) {
            System.out.println("Timer interrupted.");
        }
    }

    static void searchTask() {
        System.out.print("Enter keyword: ");
        String key = sc.nextLine();

        for (Task t : tasks) {
            if (t.title.toLowerCase().contains(key.toLowerCase())) {
                System.out.println("Found: " + t.title);
            }
        }
    }

    //Notification
    static void checkDeadlines() {
        System.out.print("Enter today's date (DD-MM): ");
        String today = sc.nextLine();

        for (Task t : tasks) {
            if (t.deadline.equals(today) && !t.completed) {
                System.out.println("⚠ Deadline Today: " + t.title);
            }
        }
    }
}
