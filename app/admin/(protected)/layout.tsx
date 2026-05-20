import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Verificação dupla de auth — o proxy já protege essa rota, mas
  // checamos aqui também porque `user` será passado adiante para a sidebar
  // (e queremos o e-mail real, não confiar só na presença do cookie).
  if (!user) {
    redirect('/admin/login')
  }

  return <AdminShell userEmail={user.email ?? ''}>{children}</AdminShell>
}
