'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Loading from '@/components/Loading'
import { provinces, getCitiesByProvince } from '@/utils/iranLocations'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  
  const [formData, setFormData] = useState({
    publicName: '',
    profileImage: '',
    province: '',
    city: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [availableCities, setAvailableCities] = useState([])
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [privacySettings, setPrivacySettings] = useState({
    showCalendar: false,
    showAchievements: true,
    showActivities: true,
    showSetups: true,
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    
    if (!userData || !tokenExpiry) {
      router.push('/auth/login')
      return
    }
    
    const now = new Date().getTime()
    if (now >= parseInt(tokenExpiry)) {
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchProfile(parsedUser.id)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
    router.push('/')
  }

  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        const province = data.user.province || ''
        const city = data.user.city || ''
        
        setFormData({
          publicName: data.user.publicName,
          profileImage: data.user.profileImage || '',
          province,
          city,
        })
        
        // اگر استان انتخاب شده، لیست شهرها را تنظیم کن
        if (province) {
          setAvailableCities(getCitiesByProvince(province))
        }
        
        setPrivacySettings(data.user.privacySettings || {
          showCalendar: false,
          showAchievements: true,
          showActivities: true,
          showSetups: true,
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('پروفایل با موفقیت به‌روز شد')
        // Update local storage
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('خطا در ذخیره پروفایل')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          privacySettings,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('تنظیمات حریم خصوصی با موفقیت به‌روز شد')
      }
    } catch (error) {
      console.error('Error saving privacy:', error)
      alert('خطا در ذخیره تنظیمات')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('لطفا یک فایل تصویری انتخاب کنید')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم تصویر نباید بیشتر از 5 مگابایت باشد')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('userId', user.id)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setFormData(prev => ({ ...prev, profileImage: data.url }))
        alert('تصویر با موفقیت آپلود شد')
      } else {
        alert(data.error || 'خطا در آپلود تصویر')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('خطا در آپلود تصویر')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value
    setFormData(prev => ({
      ...prev,
      province: selectedProvince,
      city: '', // پاک کردن شهر وقتی استان تغییر می‌کند
    }))
    
    // به‌روزرسانی لیست شهرها براساس استان انتخابی
    if (selectedProvince) {
      setAvailableCities(getCitiesByProvince(selectedProvince))
    } else {
      setAvailableCities([])
    }
  }

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('رمز عبور و تکرار آن یکسان نیستند')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('رمز عبور باید حداقل 6 کاراکتر باشد')
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          password: passwordData.newPassword,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('رمز عبور با موفقیت تنظیم شد')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        alert(data.error || 'خطا در تنظیم رمز عبور')
      }
    } catch (error) {
      console.error('Error saving password:', error)
      alert('خطا در تنظیم رمز عبور')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading text="در حال بارگذاری پروفایل..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium hidden md:inline">بازگشت</span>
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="logo-badge-light">
                  <Image 
                    src="/icons/tradinggwall-icon.svg" 
                    alt="Trading Wall Logo" 
                    width={56} 
                    height={56}
                    className="w-11 h-11 md:w-12 md:h-12"
                  />
                </div>
                <h1 className="text-xl md:text-2xl font-bold">پروفایل کاربری</h1>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl">
                      {formData.publicName.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg">{formData.publicName}</h3>
                <p className="text-sm text-gray-500">{user?.phone}</p>
                {formData.province && formData.city && (
                  <p className="text-xs text-gray-400 mt-1">📍 {formData.province}، {formData.city}</p>
                )}
              </div>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'info' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                  }`}
                >
                  👤 اطلاعات کاربری
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'privacy' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                  }`}
                >
                  🔒 تنظیمات حریم خصوصی
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'password' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                  }`}
                >
                  🔑 تغییر رمز عبور
                </button>
                <Link
                  href="/profile/setups"
                  className="w-full text-right px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 block"
                >
                  📊 ستاپ‌های معاملاتی
                </Link>
                <Link
                  href="/profile/checklists"
                  className="w-full text-right px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 block"
                >
                  ✅ چک‌لیست‌های معاملاتی
                </Link>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'achievements' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                  }`}
                >
                  🏆 دستاوردها
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'activities' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                  }`}
                >
                  📚 فعالیت‌ها
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'info' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">👤 اطلاعات کاربری</h2>
                
                <div className="space-y-6">
                  {/* Profile Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      تصویر پروفایل
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {formData.profileImage ? (
                          <img
                            src={formData.profileImage}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl border-2 border-gray-200">
                            {formData.publicName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                          <div className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                            {uploadingImage ? (
                              <>
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                در حال آپلود...
                              </>
                            ) : (
                              <>
                                📷 انتخاب تصویر
                              </>
                            )}
                          </div>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">حداکثر 5 مگابایت - JPG, PNG</p>
                      </div>
                    </div>
                  </div>

                  {/* Public Name */}
                  <Input
                    label="نام عمومی"
                    value={formData.publicName}
                    onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
                    placeholder="نام نمایشی شما"
                  />

                  {/* Province & City */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        استان
                      </label>
                      <select
                        value={formData.province}
                        onChange={handleProvinceChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
                      >
                        <option value="">انتخاب استان</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        شهر
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={!formData.province}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {formData.province ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'}
                        </option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <Input
                    label="شماره موبایل"
                    value={user?.phone}
                    disabled
                    helperText="شماره موبایل قابل تغییر نیست"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وضعیت تایید
                    </label>
                    <div className="flex items-center gap-2">
                      {user?.verified ? (
                        <>
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-600">حساب تایید شده</span>
                        </>
                      ) : (
                        <span className="text-gray-500">در انتظار تایید</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving} fullWidth>
                      {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">🔒 تنظیمات حریم خصوصی</h2>
                <p className="text-gray-600 mb-6">
                  مشخص کنید کدام بخش از پروفایل شما برای سایر کاربران قابل مشاهده باشد
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">تقویم معاملاتی</h3>
                      <p className="text-sm text-gray-600">نمایش تقویم و معاملات شما</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showCalendar}
                        onChange={(e) => setPrivacySettings({
                          ...privacySettings,
                          showCalendar: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">دستاوردها</h3>
                      <p className="text-sm text-gray-600">نمایش رتبه‌ها و جوایز</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showAchievements}
                        onChange={(e) => setPrivacySettings({
                          ...privacySettings,
                          showAchievements: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">فعالیت‌های آموزشی</h3>
                      <p className="text-sm text-gray-600">نمایش کتاب‌ها و دوره‌های خوانده شده</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showActivities}
                        onChange={(e) => setPrivacySettings({
                          ...privacySettings,
                          showActivities: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">ستاپ‌های معاملاتی</h3>
                      <p className="text-sm text-gray-600">نمایش ستاپ‌های شخصی و استراتژی‌ها</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showSetups}
                        onChange={(e) => setPrivacySettings({
                          ...privacySettings,
                          showSetups: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={handleSavePrivacy} disabled={saving} fullWidth>
                      {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    🔑 تغییر رمز عبور
                  </h2>
                  <p className="text-gray-600 mt-2">
                    با تنظیم رمز عبور، می‌توانید علاوه بر OTP با رمز عبور نیز وارد شوید
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رمز عبور جدید
                    </label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      placeholder="حداقل 6 کاراکتر"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تکرار رمز عبور
                    </label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value
                      })}
                      placeholder="تکرار رمز عبور جدید"
                      dir="ltr"
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleSavePassword} 
                      disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword} 
                      fullWidth
                    >
                      {saving ? 'در حال ذخیره...' : 'تنظیم رمز عبور'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">🏆 دستاوردها</h2>
                <div className="text-center py-12 text-gray-500">
                  <p>هنوز دستاوردی کسب نکرده‌اید</p>
                  <p className="text-sm mt-2">با ثبت معاملات و کسب رتبه در لیدربوردها، دستاوردهای خود را جمع‌آوری کنید</p>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">📚 فعالیت‌های آموزشی</h2>
                  <Button size="sm">افزودن فعالیت</Button>
                </div>
                <div className="text-center py-12 text-gray-500">
                  <p>هنوز فعالیتی ثبت نکرده‌اید</p>
                  <p className="text-sm mt-2">کتاب‌ها، دوره‌ها و منابع آموزشی خود را اینجا ثبت کنید</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
