import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const payload = await request.json()
    const stkCallback = payload?.Body?.stkCallback
    const b2cResult = payload?.Result
    const providerReference = stkCallback?.CheckoutRequestID || b2cResult?.OriginatorConversationID || b2cResult?.ConversationID
    if (!providerReference) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const resultCode = Number(stkCallback?.ResultCode ?? b2cResult?.ResultCode ?? 1)
    const metadata = stkCallback?.CallbackMetadata?.Item || b2cResult?.Result?.ResultParameters?.ResultParameter || []
    const receipt = metadata.find((item) => ['MpesaReceiptNumber', 'ReceiptNo'].includes(item.Name))?.Value
    const update = {
      status: resultCode === 0 ? 'completed' : 'failed',
      ...(receipt ? { provider_reference: String(receipt) } : {}),
      ...(resultCode !== 0 ? { failure_reason: stkCallback?.ResultDesc || b2cResult?.ResultDesc || 'Payment was not completed.' } : {}),
      updated_at: new Date().toISOString(),
    }
    await supabase.from('transactions').update(update).eq('provider_reference', providerReference)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
