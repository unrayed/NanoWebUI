import { useState } from 'react'
import { useAuthStore } from '../stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { Eye, EyeOff, User, KeyRound } from 'lucide-react'

export default function SettingsPage() {
  const username = useAuthStore((s) => s.username)
  const changePassword = useAuthStore((s) => s.changePassword)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 4 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameMsg(null)

    if (!newUsername.trim()) {
      setUsernameMsg({ type: 'error', text: 'Username cannot be empty' })
      return
    }

    setLoading(true)
    try {
      const api = (await import('../api/client')).default
      await api.post('/auth/change-username', { currentPassword, newUsername: newUsername.trim() })
      setUsernameMsg({ type: 'success', text: 'Username changed successfully' })
      localStorage.setItem('username', newUsername.trim())
      window.location.reload()
    } catch (err: any) {
      setUsernameMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to change username' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <CardTitle>Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-gray-500">Current username</p>
            <p className="text-lg font-semibold text-gray-900">{username}</p>
          </div>

          <form onSubmit={handleUsernameChange} className="space-y-3">
            <Input
              label="New Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
            />
            <Input
              label="Current Password (to confirm)"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            {usernameMsg && (
              <div className={`p-3 rounded-lg text-sm ${usernameMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {usernameMsg.text}
              </div>
            )}
            <Button type="submit" loading={loading} size="sm">
              Change Username
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-500" />
            <CardTitle>Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />

            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passwordMsg && (
              <div className={`p-3 rounded-lg text-sm ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {passwordMsg.text}
              </div>
            )}

            <Button type="submit" loading={loading} size="sm">
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
