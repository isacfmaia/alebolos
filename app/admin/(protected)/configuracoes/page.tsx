import { createClient } from '@/lib/supabase/server'
import type { SettingsRow } from '@/types/database'
import { SettingsFormClient } from '@/components/admin/configuracoes/SettingsFormClient'

export default async function AdminConfiguracoesPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').maybeSingle()
  const settings = data as SettingsRow | null

  return <SettingsFormClient settings={settings} />
}
