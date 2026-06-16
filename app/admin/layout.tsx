// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LogoutButton } from './_components/LogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  // getUser() makes a network call to verify the JWT is still valid.
  // Never use getSession() for auth checks — it only reads the local cookie.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      {/* Admin nav bar */}
      <nav className="border-b border-white/10 bg-gray-950 px-4 py-3 flex
                      items-center justify-between">
        <span className="text-sm text-gray-400">
          Logged in as <span className="text-white">{user.email}</span>
        </span>
        <LogoutButton />
      </nav>
      {children}
    </div>
  )
}