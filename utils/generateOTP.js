export function generateOTP(length = 5) {
  const digits = '0123456789'
  let otp = ''
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  
  return otp
}

export function isOTPExpired(expiresAt) {
  return new Date() > new Date(expiresAt)
}

export function getOTPExpiryTime(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000)
}
