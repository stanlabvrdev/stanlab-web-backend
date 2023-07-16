export class CreateLessonPlanDto {
  readonly lessonPlan!: string;
  readonly subject!: string;
  readonly grade!: string;
  readonly topic!: string;
}

export class UpdateLessonPlanDto {
  readonly teacher?: string;
  readonly lessonPlan?: string;
  readonly subject?: string;
  readonly grade?: string;
  readonly topic?: string;
}

export class GenerateLessonPlanDto {
  readonly subject!: string;
  readonly grade!: string;
  readonly topic!: string;
}
