'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const schema = z
  .object({
    full_name: z.string().min(2, { message: 'Enter your full name' }),
    email: z.string().email({ message: 'Enter a valid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    if (authData.session) {
      // Email confirmations are OFF — user is instantly logged in
      window.location.href = '/dashboard'
    } else {
      // Email confirmations are ON — ask user to check their inbox
      setEmailSent(true)
    }
  }

  if (emailSent) {
    return (
      <Card className="border-slate-800 bg-slate-900 shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-2xl">
            ✉️
          </div>
          <CardTitle className="text-xl text-white">Check your email</CardTitle>
          <CardDescription className="text-slate-400">
            We sent a confirmation link to your inbox. Click it to activate your account
            and start your 14-day free trial.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-slate-800 bg-slate-900 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-white">Start your free trial</CardTitle>
        <CardDescription className="text-slate-400">
          14 days free — no credit card required
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-slate-300">
              Full name
            </Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Jane Smith"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-red-400">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-slate-300">
              Confirm password
            </Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="text-xs text-red-400">{errors.confirm_password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account…' : 'Create free account'}
          </Button>
          <p className="text-xs text-slate-500 text-center">
            By signing up you agree to our{' '}
            <Link href="/terms" className="text-slate-400 hover:text-slate-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-slate-400 hover:text-slate-300">
              Privacy Policy
            </Link>
          </p>
          <p className="text-sm text-slate-400 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
