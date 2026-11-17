import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import AuthCardLayout from '@/pages/PasswordReset/AuthCardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// same rules as the Profile page's password change
const passwordSchema = z.object({
  password: z.string().min(4, 'Password must be at least 4 characters.'),
  confirmPassword: z.string().min(4, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// the emailed link carries the token in the fragment (#token=...) so it never reaches server logs
const readToken = () => new URLSearchParams(window.location.hash.slice(1)).get('token')

export default function ResetPasswordPage() {
  const [token] = useState(readToken)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async ({ password, confirmPassword }) => {
    setServerError(null)
    try {
      const response = await fetch('/api/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword }),
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setServerError(data.error || 'Something went wrong. Please try again.')
        return
      }
      // drop the spent token from the address bar and history
      window.history.replaceState(null, '', window.location.pathname)
      setDone(true)
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  return (
    <AuthCardLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{done ? 'Password updated' : 'Choose a new password'}</CardTitle>
          {(done || !token) && (
            <CardDescription>
              {done
                ? 'You can now log in with your new password.'
                : 'This reset link is incomplete. Please request a new one.'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {token && !done && (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
              {serverError && (
                <div className="text-red-400 font-extrabold" role="alert">
                  {serverError}{' '}
                  <Link to="/forgot-password" className="underline underline-offset-4">Request a new link</Link>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input {...register('password')} id="password" type="password" autoComplete="new-password" required />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input {...register('confirmPassword')} id="confirmPassword" type="password" autoComplete="new-password" required />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Update password
              </Button>
            </form>
          )}
          <div className="mt-6 text-center text-sm">
            {!token && !done
              ? <Link to="/forgot-password" className="underline underline-offset-4">Request a new link</Link>
              : <Link to="/login" className="underline underline-offset-4">Go to login</Link>}
          </div>
        </CardContent>
      </Card>
    </AuthCardLayout>
  )
}
