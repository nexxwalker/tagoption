import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MIN_DEPOSIT = 10
const MIN_WITHDRAWAL = 5

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getUser(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data } = await getSupabase().auth.getUser(token)
  return data.user
}

async function darajaToken() {
  const credentials = Buffer.from(`${process.env.Key}:${process.env.Secret}`).toString('base64')
  const response = await fetch(`${process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke'}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Daraja authentication failed')
  return (await response.json()).access_token
}

export async function POST(request) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const body = await request.json()
    const type = body.type === 'withdrawal' ? 'withdrawal' : 'deposit'
    const amount = Number(body.amount)
    const phoneNumber = String(body.phoneNumber || '').replace(/\s+/g, '')
    const minimum = type === 'deposit' ? MIN_DEPOSIT : MIN_WITHDRAWAL

    if (!Number.isFinite(amount) || amount < minimum) {
      return NextResponse.json({ error: `Minimum ${type} is $${minimum}.` }, { status: 400 })
    }
    if (!/^\+?254\d{9}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'Enter a valid Kenyan phone number.' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: transaction, error: insertError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type,
      amount: amount.toFixed(2),
      currency: 'USD',
      status: 'processing',
      provider: 'daraja',
      phone_number: phoneNumber,
    }).select('id, type, amount, currency, status, created_at').single()
    if (insertError) throw insertError

    const callbackUrl = process.env.DARAJA_CALLBACK_URL || `${new URL(request.url).origin}/api/payments/callback`

    const accessToken = await darajaToken()
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
    const password = Buffer.from(`${process.env.DARAJA_SHORTCODE || '4817173'}${process.env.Passkey}${timestamp}`).toString('base64')
    const endpoint = type === 'deposit' ? '/mpesa/stkpush/v1/processrequest' : '/mpesa/b2c/v1/paymentrequest'
    const payload = type === 'deposit'
      ? { BusinessShortCode: (process.env.DARAJA_SHORTCODE || '4817173'), Password: password, Timestamp: timestamp, TransactionType: 'CustomerPayBillOnline', Amount: Math.round(amount), PartyA: phoneNumber, PartyB: (process.env.DARAJA_SHORTCODE || '4817173'), PhoneNumber: phoneNumber, CallBackURL: callbackUrl, AccountReference: `AlphaFx-${transaction.id}`, TransactionDesc: 'AlphaFx deposit' }
      : { InitiatorName: process.env.DARAJA_INITIATOR_NAME, SecurityCredential: process.env.DARAJA_SECURITY_CREDENTIAL, CommandID: 'BusinessPayment', Amount: Math.round(amount), PartyA: (process.env.DARAJA_SHORTCODE || '4817173'), PartyB: phoneNumber, Remarks: `AlphaFx withdrawal ${transaction.id}`, QueueTimeOutURL: process.env.DARAJA_TIMEOUT_URL, ResultURL: process.env.DARAJA_RESULT_URL, Occasion: 'AlphaFx withdrawal' }

    const response = await fetch(`${process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke'}${endpoint}`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store',
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.errorMessage || result.ResponseDescription || 'Daraja request failed')

    await supabase.from('transactions').update({ provider_reference: result.CheckoutRequestID || result.OriginatorConversationID || result.ConversationID, status: 'pending' }).eq('id', transaction.id)
    return NextResponse.json({ transaction, message: type === 'deposit' ? 'Payment prompt sent to your phone.' : 'Withdrawal request submitted.' })
  } catch {
    return NextResponse.json({ error: 'Payment request could not be completed.' }, { status: 500 })
  }
}

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const { data, error } = await getSupabase().from('transactions').select('id, type, amount, currency, status, provider, provider_reference, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: 'Transaction history unavailable.' }, { status: 500 })
  return NextResponse.json({ transactions: data })
}
