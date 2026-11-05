import { StudentPicker } from '@/components/child/student-picker'
import { AppShell } from '@/components/shell/app-shell'

export const metadata = { title: 'Clase · EMMA' }

export default function ClasePage() {
  return (
    <AppShell>
      <StudentPicker />
    </AppShell>
  )
}
