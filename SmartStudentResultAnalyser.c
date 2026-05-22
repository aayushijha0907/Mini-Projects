#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Student {
    int rollNo;
    char name[50];
    float marks[5];
    float total;
    float average;
    float attendance;
    char grade;
};

void calculateResult(struct Student *s) {

    s->total = 0;

    for(int i = 0; i < 5; i++) {
        s->total += s->marks[i];
    }

    s->average = s->total / 5;

    if(s->average >= 90)
        s->grade = 'A';
    else if(s->average >= 75)
        s->grade = 'B';
    else if(s->average >= 60)
        s->grade = 'C';
    else if(s->average >= 40)
        s->grade = 'D';
    else
        s->grade = 'F';
}

void weakSubjectAnalysis(struct Student s) {

    int weak = 0;

    printf("\nWeak Subjects:\n");

    for(int i = 0; i < 5; i++) {

        if(s.marks[i] < 40) {
            printf("Subject %d needs improvement.\n", i + 1);
            weak = 1;
        }
    }

    if(!weak) {
        printf("No weak subjects detected.\n");
    }
}

void scholarshipEligibility(struct Student s) {

    printf("\nScholarship Eligibility:\n");

    if(s.average >= 85 && s.attendance >= 90) {
        printf("Eligible for Merit Scholarship\n");
    }
    else {
        printf("Not Eligible\n");
    }
}

void displayStudent(struct Student s) {

    printf("\n===========================================");
    printf("\nRoll Number : %d", s.rollNo);
    printf("\nName        : %s", s.name);

    for(int i = 0; i < 5; i++) {
        printf("\nSubject %d Marks : %.2f", i + 1, s.marks[i]);
    }

    printf("\nAttendance  : %.2f%%", s.attendance);
    printf("\n-------------------------------------------");
    printf("\nTotal       : %.2f", s.total);
    printf("\nAverage     : %.2f", s.average);
    printf("\nGrade       : %c", s.grade);

    if(s.grade == 'A')
        printf("\nPerformance : Outstanding");
    else if(s.grade == 'B')
        printf("\nPerformance : Excellent");
    else if(s.grade == 'C')
        printf("\nPerformance : Good");
    else if(s.grade == 'D')
        printf("\nPerformance : Average");
    else
        printf("\nPerformance : Poor");

    weakSubjectAnalysis(s);

    scholarshipEligibility(s);

    printf("\n===========================================\n");
}

void saveReport(struct Student students[], int n) {

    FILE *fp;

    fp = fopen("AI_Student_Report.txt", "w");

    if(fp == NULL) {
        printf("Error saving file.\n");
        return;
    }

    fprintf(fp, "========== AI STUDENT ANALYTICS REPORT ==========\n\n");

    for(int i = 0; i < n; i++) {

        fprintf(fp, "Roll No : %d\n", students[i].rollNo);
        fprintf(fp, "Name    : %s\n", students[i].name);
        fprintf(fp, "Average : %.2f\n", students[i].average);
        fprintf(fp, "Grade   : %c\n", students[i].grade);
        fprintf(fp, "Attendance : %.2f%%\n", students[i].attendance);
        fprintf(fp, "------------------------------------------------\n");
    }

    fclose(fp);

    printf("\nAnalytics report generated successfully.\n");
}

void topper(struct Student students[], int n) {

    int top = 0;

    for(int i = 1; i < n; i++) {

        if(students[i].average > students[top].average) {
            top = i;
        }
    }

    printf("\n============= CLASS TOPPER =============\n");
    printf("Name      : %s\n", students[top].name);
    printf("Average   : %.2f\n", students[top].average);
    printf("Grade     : %c\n", students[top].grade);
    printf("========================================\n");
}

int main() {

    int n;

    printf("==============================================\n");
    printf("      AI Student Performance Analyzer\n");
    printf("==============================================\n");

    printf("Enter number of students: ");
    scanf("%d", &n);

    struct Student students[n];

    for(int i = 0; i < n; i++) {

        printf("\nEnter details for Student %d\n", i + 1);

        printf("Enter Roll Number: ");
        scanf("%d", &students[i].rollNo);

        getchar();

        printf("Enter Name: ");
        fgets(students[i].name, sizeof(students[i].name), stdin);

        students[i].name[strcspn(students[i].name, "\n")] = '\0';

        printf("Enter marks for 5 subjects:\n");

        for(int j = 0; j < 5; j++) {

            do {

                printf("Subject %d: ", j + 1);
                scanf("%f", &students[i].marks[j]);

                if(students[i].marks[j] < 0 || students[i].marks[j] > 100) {
                    printf("Invalid marks. Enter between 0-100.\n");
                }

            } while(students[i].marks[j] < 0 || students[i].marks[j] > 100);
        }

        printf("Enter Attendance Percentage: ");
        scanf("%f", &students[i].attendance);

        calculateResult(&students[i]);
    }

    printf("\n\n=========== STUDENT ANALYTICS REPORT ===========\n");

    for(int i = 0; i < n; i++) {
        displayStudent(students[i]);
    }

    topper(students, n);

    saveReport(students, n);

    printf("\nProgram Executed Successfully.\n");

    return 0;
}
