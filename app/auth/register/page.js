'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  // در فاز اول، register همان login است (فقط با OTP)
  // در آینده می‌توان فرم جداگانه اضافه کرد
  
  // Redirect to login
  useEffect(() => {
    router.push('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>در حال انتقال به صفحه ورود...</p>
      </div>
    </div>
  )
}
