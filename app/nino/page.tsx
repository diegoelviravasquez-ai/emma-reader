import { ChildFlow } from '@/components/child/child-flow'
import { AppShell } from '@/components/shell/app-shell'

export const metadata = { title: 'Lectura · EMMA' }

export default function NinoPage() {
  return (
    <AppShell>
      <ChildFlow />
    </AppShell>
  )
}
