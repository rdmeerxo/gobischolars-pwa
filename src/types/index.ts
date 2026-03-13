export type Role = 'admin' | 'faculty' | 'student'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'remote' | 'sick'
export type RequestType = 'absence' | 'sick_leave' | 'remote_work'
export type RequestStatus = 'pending' | 'approved' | 'denied'

export interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  role: Role
  department?: string
  position?: string
  employment_type?: 'full_time' | 'part_time'
}

export interface AttendanceLog {
  id: string
  user_id: string
  date: string
  check_in_time?: string
  check_out_time?: string
  check_in_photo_url?: string
  total_hours?: number
  status: AttendanceStatus
  note?: string
  filled_by_admin: boolean
}

export interface Request {
  id: string
  user_id: string
  type: RequestType
  date_from: string
  date_to: string
  reason?: string
  status: RequestStatus
  created_at: string
}

export interface WeeklyReport {
  id: string
  user_id: string
  week_start_date: string
  week_end_date: string
  content: string
  status: 'submitted' | 'reviewed'
  admin_feedback?: string
}