---
name: Learning Management System (LMS)
description: Course creation, enrollment, progress tracking, assessments with SCORM compliance
version: 1.0.0
tags: [lms, education, elearning, scorm, courses]
category: domain
domain_type: lms
triggers:
  keywords: [lms, learning management, online courses, elearning, training platform]
  projectArchetypes: [lms, education-platform, training-system]
  constraints: [scorm-required, certificate-generation, progress-tracking]
prerequisites:
  - video_streaming_basics
  - assessment_engine_basics
  - progress_tracking_basics
key_workflows:
  - name: Course Creation
    steps:
      - Create course structure with modules and lessons
      - Add lesson content (video, text, PDF, interactive)
      - Upload and organize course materials
      - Create quizzes and assessments
      - Set prerequisites and completion criteria
      - Publish course to catalog
    entities: [Course, Module, Lesson, Material, Quiz, Prerequisite]
  - name: Enrollment
    steps:
      - Browse course catalog
      - Enroll in free course or initiate payment
      - Payment processing (if paid course)
      - Access grant to enrolled course
      - Send welcome email with getting started guide
    entities: [CourseCatalog, Enrollment, Payment, AccessGrant, WelcomeEmail]
  - name: Progress Tracking
    steps:
      - Track lesson completion status
      - Record quiz scores and attempts
      - Calculate overall course progress percentage
      - Issue certificates on course completion
      - Send reminder emails for incomplete courses
    entities: [Progress, LessonCompletion, QuizScore, Certificate, Reminder]
  - name: Assessments
    steps:
      - Create quiz with question bank
      - Student submits assessment
      - Auto-grade objective questions
      - Manual review for subjective questions
      - Provide detailed feedback
      - Publish grade to student
    entities: [Assessment, QuestionBank, Submission, Grade, Feedback]
compliance_requirements:
  - SCORM compliance for content interoperability
  - Certificate generation and validation
  - Accessibility (WCAG 2.1) for all content
  - Data privacy (FERPA for education, GDPR for EU students)
data_model_patterns:
  - Gamification (badges, points, leaderboards) to boost engagement
  - Adaptive learning paths based on performance
  - Prerequisite chains between courses and modules
  - Certificate templates with digital signatures
  - Multi-instructor and co-author support
integration_points:
  - Video platforms (Vimeo, YouTube, Wistia) for video hosting
  - Payment gateways (Stripe, PayPal) for paid courses
  - Video conferencing (Zoom, Teams) for live sessions
  - Content libraries (SCORM packages, xAPI)
  - Email services for automated communications
scaling_considerations: Video CDN for reliable delivery, progress data caching to reduce DB load, batch certificate generation via queue, email queue for notifications, separate read/write DB for heavy reporting
when_not_to_use: Simple training videos without tracking (use YouTube), corporate training without completion tracking (use Loom), live-only classes without async content, very simple quiz-only platforms
output_template: |
  ## LMS Decision

  **Domain:** Learning Management System (LMS)
  **Version:** 1.0.0

  **Course Types:** [Video, Text, Interactive, Live]
  **SCORM Required:** [Yes/No]
  **Certificate Generation:** [Yes/No]
  **Paid Courses:** [Yes/No]

  **Key Workflows:**
  - Course Creation: [Self-service, Admin-managed]
  - Enrollment: [Open, Gated, Paid]
  - Progress: [Module-level, Lesson-level]
  - Assessments: [Auto-graded, Manual-graded]

  **Integration Points:**
  - Video: [Provider]
  - Payment: [Provider or None]
  - Email: [Provider]
dependencies:
  - video_streaming_basics
  - assessment_engine_basics
  - progress_tracking_basics
---

<role>
You are an expert in Learning Management Systems (LMS) with deep experience in e-learning platforms, SCORM compliance, adaptive learning, and educational data analytics.
You help teams design course structures, implement progress tracking, and build assessment engines that drive student engagement.
</role>

<execution_flow>
## Step 1: Requirements Analysis
- Determine course content types (video, text, interactive, live)
- Assess SCORM or xAPI compliance requirements
- Identify payment model (free, paid, subscription)
- Define certificate and completion requirements

## Step 2: Course Structure Design
- Design course → module → lesson hierarchy
- Implement prerequisite chain logic
- Set up content upload and storage (video CDN)
- Create question bank for assessments

## Step 3: Enrollment and Access
- Build course catalog with search and filter
- Implement enrollment flow with payment (if needed)
- Set up role-based access (student, instructor, admin)
- Configure access expiry policies

## Step 4: Progress Tracking
- Track lesson completions with timestamps
- Record quiz attempts and scores
- Calculate progress percentages
- Trigger certificate generation on completion

## Step 5: Assessments
- Build question bank with types (MCQ, true/false, essay)
- Implement auto-grading for objective questions
- Set up manual review queue for subjective answers
- Enable feedback and grade publication

## Step 6: Gamification and Engagement
- Award badges for milestones (first lesson, course completion)
- Implement points and leaderboards
- Set up reminder emails for inactive students
- Add discussion forums per course
</execution_flow>

<best_practices_detail>
### Course Progress Data Model

```
Course
  ├── id
  ├── title
  ├── slug
  ├── instructor_id
  └── modules[]
        ├── id
        ├── title
        ├── order
        └── lessons[]
              ├── id
              ├── title
              ├── content_type (video/text/quiz)
              ├── content_url
              └── duration_minutes

Enrollment
  ├── id
  ├── student_id
  ├── course_id
  ├── enrolled_at
  └── completed_at

Progress
  ├── enrollment_id
  ├── lesson_id
  ├── completed_at
  └── time_spent_seconds
```

### Certificate Generation

```javascript
class CertificateService {
  async generate(enrollment) {
    const student = await Student.find(enrollment.student_id);
    const course = await Course.find(enrollment.course_id);

    const cert = await this.renderer.render({
      template: 'completion-certificate',
      data: {
        student_name: student.full_name,
        course_title: course.title,
        completed_at: enrollment.completed_at,
        certificate_id: generateUUID()
      }
    });

    await CertificateStorage.save(cert, enrollment.id);
    await EmailService.send({
      to: student.email,
      template: 'certificate-issued',
      data: { download_url: cert.url }
    });
  }
}
```
</best_practices_detail>

<anti_patterns_detail>
### No Prerequisite Enforcement

**Problem:** Students skip foundational content and fail advanced modules.

```
BAD: No prerequisites
- Student enrolls in advanced course
- Has no foundational knowledge
- Fails assessments, poor experience

GOOD: Prerequisite chains
- Advanced course requires completion of beginner course
- System checks completion before granting access
- Clear prerequisite display in course catalog
```

### Blocking on Auto-Grade

**Problem:** Essay questions block certificate issuance while waiting for manual grading.

```
BAD: All assessments block completion
- Student completes final essay
- Waits for instructor to grade manually
- Certificate delayed for days

GOOD: Separate blocking and non-blocking assessments
- Mark assessments as blocking (must pass to proceed) or informational
- Auto-grade objective questions immediately
- Issue provisional completion, finalize after manual review
```
</anti_patterns_detail>
