import { TeacherDesk } from '@/components/teacher/teacher-desk'
import { AppShell } from '@/components/shell/app-shell'

export const metadata = { title: 'Docente · EMMA' }

export default function DocentePage() {
  return (
    <AppShell>
      <TeacherDesk />
    </AppShell>
  )
}
