/**
 * Shared types for Prisma $queryRaw results.
 * SQLite raw queries return plain objects without Prisma type inference,
 * so we define the shapes here to avoid `as any` casts.
 */

export interface WatchTimeSummary {
  totalSeconds: number | string;
  uniqueViewers: number | string;
  totalViews: number | string;
}

export interface CompletionSummary {
  total: number | string;
  avgCompletion: number | string;
}

export interface DailyWatchStats {
  date: string;
  totalSeconds: number | string;
  uniqueViewers: number | string;
  totalViews: number | string;
}

export interface TopVideoStats {
  id: string;
  title: string;
  totalSeconds: number | string;
  views: number | string;
  avgCompletion: number | string;
}

export interface TopStudentStats {
  id: string;
  name: string | null;
  email: string;
  totalSeconds: number | string;
  videosWatched: number | string;
  totalViews: number | string;
}

export interface RoleActivity {
  role: string;
  viewCount: number | string;
  totalSeconds: number | string;
}

export interface StudentAnalyticsSummary {
  totalSeconds: number | string;
  videosWatched: number | string;
  totalViews: number | string;
  avgCompletion: number | string;
  commentsCount: number | string;
  likesCount: number | string;
}

export interface WeeklyActivity {
  week: string;
  totalSeconds: number | string;
  views: number | string;
}

export interface AvgGradeResult {
  avgGrade: number | string;
}

export interface TopCourse {
  id: string;
  title: string;
  enrollments: number | string;
  avgGrade: number | string;
}

export interface GradeDistribution {
  range: string;
  count: number | string;
}

export interface EnrollmentTrend {
  date: string;
  count: number | string;
}

export interface QuizStatsItem {
  id: string;
  title: string;
  attempts: number | string;
  avgScore: number | string;
}

export interface LessonCompletionStats {
  id: string;
  title: string;
  completions: number | string;
}

export interface CourseGradeStats {
  courseId: string;
  courseTitle: string;
  avgGrade: number | string;
  studentCount: number | string;
}

export interface TopStudentWithGrade {
  id: string;
  name: string | null;
  email: string;
  avgGrade: number | string;
  coursesEnrolled: number | string;
}

export interface StrugglingStudent {
  id: string;
  name: string | null;
  email: string;
  avgGrade: number | string;
  coursesEnrolled: number | string;
}

export interface VideoAnalyticsItem {
  id: string;
  title: string;
  views: number | string;
  watchSeconds: number | string;
  uniqueViewers: number | string;
  avgCompletion: number | string;
}

export interface StudentAnalyticsItem {
  id: string;
  name: string | null;
  email: string;
  totalViews: number | string;
  watchSeconds: number | string;
  videosWatched: number | string;
}

export interface TotalCountResult {
  total: number | string;
}

export interface TotalSecondsResult {
  totalSeconds: number | string;
}

export interface TopCourseWithDetails {
  id: string;
  title: string;
  status: string;
  teacherName: string | null;
  enrollmentCount: number | string;
  completionCount: number | string;
  avgGrade: number | string;
}

export interface GradeDistributionWithAvg {
  bucket: string;
  count: number | string;
  avgValue: number | string;
}

export interface EnrollmentTrendWithCount {
  date: string;
  enrollments: number | string;
}

export interface QuizStatsWithDetails {
  quizTitle: string;
  courseTitle: string;
  totalAttempts: number | string;
  avgScore: number | string;
  passedCount: number | string;
}

export interface LessonCompletionWithDetails {
  id: string;
  title: string;
  totalLessons: number | string;
  totalCompletions: number | string;
  enrolledStudents: number | string;
}

export interface GradeOverview {
  totalGrades: number | string;
  avgGrade: number | string;
  minGrade: number | string;
  maxGrade: number | string;
  passing: number | string;
}

export interface CourseGradeWithDetails {
  id: string;
  title: string;
  teacherName: string | null;
  gradeCount: number | string;
  avgGrade: number | string;
  minGrade: number | string;
  maxGrade: number | string;
  passing: number | string;
  total: number | string;
}

export interface StudentWithGradeDetails {
  id: string;
  name: string | null;
  email: string;
  gradeCount: number | string;
  avgGrade: number | string;
  coursesCompleted: number | string;
}

export interface WeeklyActivityDay {
  date: string;
  totalSeconds: number | string;
  videosWatched: number | string;
}

export interface StudentSummary {
  totalSeconds: number | string;
  videosWatched: number | string;
  totalViews: number | string;
  avgCompletion: number | string;
}

export interface ExportStudentStats {
  id: string;
  name: string | null;
  email: string;
  totalSeconds: number | string;
  videosWatched: number | string;
  totalViews: number | string;
}

export interface ExportVideoStats {
  id: string;
  title: string;
  duration: number | null;
  uniqueViewers: number | string;
  totalSeconds: number | string;
  avgCompletion: number | string;
}

export interface ExportTotalStats {
  totalSeconds: number | string;
  uniqueViewers: number | string;
  totalViews: number | string;
}

// ---- Performance Analytics ----

export interface PerformanceOverview {
  totalSubmissions: number | string;
  totalQuizAttempts: number | string;
  avgSubmissionScore: number | string;
  avgQuizScore: number | string;
  submissionCompletionRate: number | string;
  quizPassRate: number | string;
}

export interface PerformanceTrend {
  date: string;
  avgScore: number | string;
  submissionCount: number | string;
  quizAttemptCount: number | string;
}

export interface CoursePerformanceComparison {
  courseId: string;
  courseTitle: string;
  teacherName: string | null;
  studentCount: number | string;
  avgGrade: number | string;
  avgSubmissionScore: number | string;
  avgQuizScore: number | string;
  completionRate: number | string;
}

export interface SubmissionCompletionRate {
  courseId: string;
  courseTitle: string;
  totalAssignments: number | string;
  totalSubmissions: number | string;
  completionRate: number | string;
  avgScore: number | string;
}

export interface QuizPassRateTrend {
  date: string;
  totalAttempts: number | string;
  passedCount: number | string;
  passRate: number | string;
  avgScore: number | string;
}

export interface PerformanceDistribution {
  range: string;
  studentCount: number | string;
  percentage: number | string;
}

export interface CohortData {
  cohortLabel: string;
  studentCount: number | string;
  avgGrade: number | string;
  completionRate: number | string;
  activeStudents: number | string;
}

export interface AtRiskStudent {
  id: string;
  name: string | null;
  email: string;
  riskFactors: string[];
  avgGrade: number | string;
  lastActivityDate: string | null;
  coursesEnrolled: number | string;
  coursesAtRisk: number | string;
  riskScore: number | string;
}

// ---- Comparative Analytics ----

export interface StudentComparison {
  studentId: string;
  name: string | null;
  email: string;
  courseTitle: string;
  grade: number | string;
  submissionCount: number | string;
  quizAttempts: number | string;
  quizPassRate: number | string;
  completionRate: number | string;
}

export interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  courseCount: number | string;
  totalStudents: number | string;
  avgGrade: number | string;
  avgQuizScore: number | string;
  passRate: number | string;
}

export interface CourseDifficultyIndex {
  courseId: string;
  courseTitle: string;
  avgGrade: number | string;
  gradeStdDev: number | string;
  failureRate: number | string;
  difficultyScore: number | string;
}

// ---- Trends Analytics ----

export interface SemesterAnalysis {
  semester: string;
  startDate: string;
  endDate: string;
  enrollmentCount: number | string;
  avgGrade: number | string;
  completionRate: number | string;
  quizPassRate: number | string;
  activeStudents: number | string;
}

export interface MonthOverMonth {
  month: string;
  avgGrade: number | string;
  totalSubmissions: number | string;
  quizPassRate: number | string;
  enrollmentCount: number | string;
}

export interface HeatmapDataPoint {
  dayOfWeek: number;
  hour: number;
  activityCount: number | string;
  watchSeconds: number | string;
}

export interface LearningVelocity {
  studentId: string;
  name: string | null;
  email: string;
  completionsPerWeek: number | string;
  trend: string;
}

// ---- Export Extensions ----

export interface ExportPerformanceStats {
  studentName: string;
  email: string;
  courseTitle: string;
  grade: number | string;
  submissionCount: number | string;
  quizAttempts: number | string;
  quizPassRate: number | string;
}

export interface ExportCohortStats {
  cohort: string;
  studentCount: number | string;
  avgGrade: number | string;
  completionRate: number | string;
}

export interface ExportAtRiskStats {
  name: string;
  email: string;
  avgGrade: number | string;
  riskScore: number | string;
  riskFactors: string;
}
