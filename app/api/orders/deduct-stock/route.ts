import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/loaders'

interface OrderItem {
  product_id: string
  quantity: number
  product_name: string
}

export async function POST(request: NextRequest) {
  try {
    // ✅ AUTH CHECK - Only authenticated users can deduct stock
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { orderId, items } = await request.json()

    if (!orderId || !items) {
      return NextResponse.json(
        { error: 'Missing orderId or items' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    // Deduct stock for each item
    const deductResults = []

    for (const item of items as OrderItem[]) {
      try {
        // Get current stock
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()

        if (fetchError || !product) {
          console.warn(`⚠️ Could not fetch stock for product ${item.product_id}:`, fetchError)
          deductResults.push({
            product_id: item.product_id,
            success: false,
            reason: 'Product not found'
          })
          continue
        }

        // Calculate new stock
        const newStock = Math.max(0, (product as any).stock - item.quantity)

        // Update stock in database
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id)

        if (updateError) {
          console.error(
            `❌ Stock reduction failed for product ${item.product_id}:`,
            updateError
          )
          deductResults.push({
            product_id: item.product_id,
            success: false,
            reason: updateError.message
          })
        } else {
          console.log(
            `✅ Stock reduced: ${item.product_name} from ${(product as any).stock} to ${newStock}`
          )
          deductResults.push({
            product_id: item.product_id,
            success: true,
            oldStock: (product as any).stock,
            newStock: newStock
          })
        }
      } catch (err) {
        console.error(
          `❌ Exception deducting stock for product ${item.product_id}:`,
          err
        )
        deductResults.push({
          product_id: item.product_id,
          success: false,
          reason: 'Exception occurred'
        })
      }
    }

    const allSuccessful = deductResults.every((r: any) => r.success)

    return NextResponse.json(
      {
        success: allSuccessful,
        results: deductResults,
        orderId: orderId
      },
      { status: allSuccessful ? 200 : 207 }
    )
  } catch (error) {
    console.error('❌ Stock deduction API error:', error)
    return NextResponse.json(
      { error: 'Failed to deduct stock', details: String(error) },
      { status: 500 }
    )
  }
}
