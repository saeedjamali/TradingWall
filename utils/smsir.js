import axios from 'axios'

const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY
const SMS_IR_LINE_NUMBER = process.env.SMS_IR_LINE_NUMBER
const SMS_IR_BASE_URL = 'https://api.sms.ir'

export async function sendOTP(phone, code) {
  try {
    const response = await axios.post(
      `${SMS_IR_BASE_URL}/v1/send/verify`,
      {
        mobile: phone,
        templateId: 100000, // TODO: Replace with your actual template ID from sms.ir panel
        parameters: [
          {
            name: 'CODE',
            value: code
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SMS_IR_API_KEY,
        }
      }
    )

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('SMS.ir Error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || 'خطا در ارسال پیامک'
    }
  }
}

export async function sendCustomSMS(phone, message) {
  try {
    const response = await axios.post(
      `${SMS_IR_BASE_URL}/v1/send/bulk`,
      {
        lineNumber: SMS_IR_LINE_NUMBER,
        messageText: message,
        mobiles: [phone]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SMS_IR_API_KEY,
        }
      }
    )

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('SMS.ir Error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || 'خطا در ارسال پیامک'
    }
  }
}
