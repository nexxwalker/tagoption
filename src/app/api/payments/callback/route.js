import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const payload = await request.json()
    const callback = payload?.Body?.stkCallback
    const checkoutRequestId = callback?.CheckoutRequestID
    if (!checkoutRequestId) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const resultCode = Number(callback.ResultCode)
    const metadata = callback.CallbackMetadata?.Item || []
    const receipt = metadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value
    const update = {
      status: resultCode === 0 ? 'completed' : 'failed',
      ...(receipt ? { provider_reference: String(receipt) } : {}),
      ...(resultCode !== 0 ? { failure_reason: callback.ResultDesc || 'Payment was not completed.' } : {}),
      updated_at: new Date().toISOString(),
    }
    await supabase.from('transactions').update(update).eq('provider_reference', checkoutRequestId)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
