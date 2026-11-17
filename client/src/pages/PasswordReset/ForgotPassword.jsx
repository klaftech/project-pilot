import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import AuthCardLayout from '@/pages/PasswordReset/AuthCardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    setError(null)
    try {
      const response = await fetch('/api/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error(response.status)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <AuthCardLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot your password?</CardTitle>
          <CardDescription>
            {sent
              ? "If that email has an account, we've sent a link to reset your password. It expires in 1 hour."
              : "Enter your email and we'll send you a link to reset it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent && (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
              {error && <div className="text-red-400 font-extrabold" role="alert">{error}</div>}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input {...register('email')} id="email" type="email" placeholder="m@example.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Send reset link
              </Button>
            </form>
          )}
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="underline underline-offset-4">Back to login</Link>
          </div>
        </CardContent>
      </Card>
    </AuthCardLayout>
  )
}
