export interface EnrolledStudentStatus {
  name: string
  value: number
  color: string
}

export interface EnrolledStudentsType {
  total: number
  studyingCount: number
  breakdown: EnrolledStudentStatus[]
}

export const enrolledStudentsData: EnrolledStudentsType = {
  total: 295,
  studyingCount: 275,
  breakdown: [
    {
      name: "Studying",
      value: 275,
      color: "hsl(158, 85%, 44%)",
    },
    {
      name: "Waiting",
      value: 12,
      color: "hsl(38, 92%, 50%)",
    },
    {
      name: "Plan ended",
      value: 6,
      color: "hsl(25, 95%, 53%)",
    },
    {
      name: "Stopped",
      value: 2,
      color: "hsl(0, 84%, 60%)",
    },
  ],
}
