import { SettingsPanel } from '@/components/shell/settings-panel'
import { AppShell } from '@/components/shell/app-shell'

export const metadata = { title: 'Ajustes · EMMA' }

export default function AjustesPage() {
  return (
    <AppShell>
      <SettingsPanel />
    </AppShell>
  )
}
