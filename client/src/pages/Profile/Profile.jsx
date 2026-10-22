import { useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import UserContext from '@/context/UserContext'
import AppWrapper from '@/components/AppWrapper'
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

const profileSchema = z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters.'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters.'),
})

const passwordSchema = z.object({
    password: z.string().min(4, 'Password must be at least 4 characters.'),
    confirmPassword: z.string().min(4, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

export default function ProfilePage() {
    const { user, setUser } = useContext(UserContext)
    const navigate = useNavigate()

    const [profileSuccess, setProfileSuccess] = useState(null)
    const [profileError, setProfileError] = useState(null)
    const [passwordSuccess, setPasswordSuccess] = useState(null)
    const [passwordError, setPasswordError] = useState(null)

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name ?? '',
            last_name: user?.last_name ?? '',
        },
    })

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPassword,
        formState: { errors: passwordErrors },
    } = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    })

    const patchProfile = async (payload) => {
        const response = await fetch('/api/profile', {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error(response.status)
        return response.json()
    }

    const onProfileSubmit = async (form_data) => {
        setProfileError(null)
        setProfileSuccess(null)
        try {
            const data = await patchProfile({
                first_name: form_data.first_name,
                last_name: form_data.last_name,
            })
            setUser(data)
            setProfileSuccess('Profile updated successfully.')
        } catch {
            setProfileError('Failed to update profile. Please try again.')
        }
    }

    const onPasswordSubmit = async (form_data) => {
        setPasswordError(null)
        setPasswordSuccess(null)
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    password: form_data.password,
                    confirmPassword: form_data.confirmPassword,
                }),
                headers: { 'Content-Type': 'application/json' },
            })
            if (!response.ok) throw new Error(response.status)
            // 204 = session cleared on server, redirect to login
            setUser(null)
            navigate('/login')
        } catch {
            setPasswordError('Failed to update password. Please try again.')
        }
    }

    return (
        <AppWrapper>
            <div className="max-w-lg mx-auto p-6 space-y-6">

                {/* Profile Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your name and account details.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input {...registerProfile('first_name')} id="first_name" />
                                {profileErrors.first_name && (
                                    <p className="text-sm text-destructive">{profileErrors.first_name.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input {...registerProfile('last_name')} id="last_name" />
                                {profileErrors.last_name && (
                                    <p className="text-sm text-destructive">{profileErrors.last_name.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user?.email ?? ''} disabled />
                            </div>
                            {profileSuccess && <p className="text-sm text-green-600">{profileSuccess}</p>}
                            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Save Changes</Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Password */}
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Enter a new password below.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="password">New Password</Label>
                                <Input {...registerPassword('password')} id="password" type="password" />
                                {passwordErrors.password && (
                                    <p className="text-sm text-destructive">{passwordErrors.password.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input {...registerPassword('confirmPassword')} id="confirmPassword" type="password" />
                                {passwordErrors.confirmPassword && (
                                    <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
                                )}
                            </div>
                            {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
                            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Update Password</Button>
                        </CardFooter>
                    </form>
                </Card>

            </div>
        </AppWrapper>
    )
}
