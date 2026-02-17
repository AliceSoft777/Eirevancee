"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCart } from "@/hooks/useCart"
import { formatPrice } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2, Tag } from "lucide-react"
import Link from "next/link"
import type { UserAddress } from "@/hooks/useAddresses"

interface AppliedCoupon {
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
}

interface CheckoutClientProps {
    isLoggedIn: boolean
    userRole: 'customer' | 'sales' | 'admin'
    initialAddresses: UserAddress[]
    initialProfile: { full_name: string | null; phone: string | null } | null
    userId: string | null
}

export default function CheckoutClient({ isLoggedIn, userRole, initialAddresses, initialProfile, userId }: CheckoutClientProps) {
    const supabase = getSupabaseBrowserClient()
    const { cartItems, isLoading: cartLoading, clearCart, getCartTotal } = useCart()
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)

    const [addresses] = useState<UserAddress[]>(initialAddresses)
    const [selectedAddressId, setSelectedAddressId] = useState<string>("")
    const [useNewAddress, setUseNewAddress] = useState(initialAddresses.length === 0)

    // ✅ Pre-fill billing from server-fetched profile
    const [formData, setFormData] = useState({
        full_name: initialProfile?.full_name ?? "",
        email: "",
        phone: initialProfile?.phone ?? "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        payment: "card"
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

    const subtotal = getCartTotal()
    const TAX_RATE = 0.23 // 23% VAT for Ireland
    const SHIPPING_THRESHOLD = 100
    const SHIPPING_FEE = 10

    const couponDiscount = appliedCoupon
        ? appliedCoupon.discount_type === 'percentage'
            ? subtotal * (appliedCoupon.discount_value / 100)
            : Math.min(appliedCoupon.discount_value, subtotal)
        : 0
    const discountedSubtotal = subtotal - couponDiscount
    const tax = discountedSubtotal * TAX_RATE
    const shippingFee = discountedSubtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const total = discountedSubtotal + tax + shippingFee

    // Load applied coupon from sessionStorage (set in cart page)
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('appliedCoupon')
            if (stored) setAppliedCoupon(JSON.parse(stored))
        } catch {}
    }, [])

    // Pre-fill email from auth session (not available server-side)
    useEffect(() => {
        supabase.auth.getSession().then((result) => {
            if (!result) return
            const email = result.data?.session?.user?.email
            if (email) setFormData(prev => ({ ...prev, email }))
        }).catch(() => {})
    }, [supabase])

    // Auto-select default (or first) saved address on mount
    useEffect(() => {
        if (addresses.length === 0) return
        const defaultAddress = addresses.find(a => a.is_default) ?? addresses[0]
        handleAddressSelection(defaultAddress.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ✅ BULLETPROOF: Auto-fill form via State Update (Using exact DB fields)
    const handleAddressSelection = (addressId: string) => {
        console.log('[Checkout] 📍 Address selected:', addressId)
        setSelectedAddressId(addressId)
        const address = addresses.find(a => a.id === addressId)
        
        if (address) {
            console.log('[Checkout] ✅ Found address:', address)
            setFormData(prev => ({
                ...prev,
                full_name: address.full_name,
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                phone: address.phone
            }))

            setUseNewAddress(false)
            toast.success(`✅ Address loaded: ${address.full_name}`)
        } else {
            console.error('[Checkout] ❌ Address not found in list')
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsProcessing(true)

        console.log('[Checkout] 🚀 Submit started, userId:', userId)

        // Set timeout to prevent infinite loading (30 seconds)
        const timeoutId = setTimeout(() => {
            setIsProcessing(false)
            toast.error("Checkout took too long. Please try again.")
        }, 60000)

        try {
            // Get data from Controlled State instead of DOM
            const {
                full_name,
                email,
                phone,
                street,
                city,
                state,
                pincode,
                payment: paymentMethod
            } = formData;

            // Validate required fields
            if (!full_name || !email || !phone || !street || !city || !state || !pincode) {
                clearTimeout(timeoutId)
                console.log('[Checkout] ❌ Validation failed - missing fields')
                toast.error("Please fill in all required fields")
                setIsProcessing(false)
                return
            }

            // Use cached userId from state (fetched on mount) - avoids AbortError
            if (!userId) {
                clearTimeout(timeoutId)
                console.log('[Checkout] ❌ No userId - user not logged in')
                toast.error("You must be logged in to place an order")
                router.push("/login")
                setIsProcessing(false)
                return
            }

            console.log('[Checkout] ✅ Validation passed, creating order...')

            // Create delivery address as JSONB object
            const deliveryAddressObj = {
                street: street,
                city: city,
                state: state,
                pincode: pincode,
                country: "Ireland"
            }

            // ✅ STEP 0: Save address to customer_addresses table (non-blocking)
            const addressPayload = {
                user_id: userId,
                full_name: full_name,
                street: street,
                city: city,
                state: state,
                pincode: pincode,
                country: "Ireland",
                phone: phone,
                is_default: false,
                label: null
            }

            // ✅ Check if this address already exists before inserting
            try {
                const checkResult = await (supabase
                    .from('customer_addresses') as any)
                    .select('id')
                    .eq('user_id', userId)
                    .eq('street', street)
                    .eq('city', city)
                    .eq('pincode', pincode)
                    .limit(1)

                const existingAddresses = checkResult?.data ?? []
                if (existingAddresses.length === 0) {
                    const insertResult = await (supabase
                        .from('customer_addresses') as any)
                        .insert([addressPayload])
                        .select()
                    if (insertResult?.error) {
                        console.warn('[Checkout] Address save failed (non-blocking):', insertResult.error.message)
                    }
                }
            } catch (addrErr) {
                console.warn('[Checkout] Address save failed (non-blocking):', addrErr)
            }

            // Build order items array for JSONB storage
            const orderItemsArray = cartItems.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.product_price,
                subtotal: item.product_price * item.quantity
            }))

            // Build status history for audit trail
            const statusHistoryArray = [
                {
                    status: "Pending",
                    timestamp: new Date().toISOString(),
                    notes: paymentMethod === 'offline_cash' ? 'Cash payment - awaiting store receipt' : 'Card payment - awaiting verification'
                }
            ]

            // Build order payload (shared between card and offline)
            const orderPayload = {
                user_id: userId,
                customer_id: userId,
                customer_name: full_name,
                customer_email: email,
                customer_phone: phone,
                subtotal: Number(subtotal.toFixed(2)),
                tax: Number(tax.toFixed(2)),
                shipping_fee: Number(shippingFee.toFixed(2)),
                discount: Number(couponDiscount.toFixed(2)),
                coupon_code: appliedCoupon?.code ?? null,
                total: Number(total.toFixed(2)),
                status: 'Pending',
                payment_method: paymentMethod,
                payment_status: 'Pending',
                delivery_address: deliveryAddressObj as any,
                items: orderItemsArray as any,
                status_history: statusHistoryArray as any,
                order_number: `ORD-${Date.now()}`,
                source: 'web'
            }

            // ✅ CARD PAYMENT: Create Stripe session FIRST, then create order only on success
            if (paymentMethod === 'card') {
                try {
                    // Step 1: Create Stripe session first (validates currency = EUR)
                    const stripeResponse = await fetch('/api/create-stripe-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId: orderPayload.order_number,
                            amount: total,
                            customerEmail: email
                        })
                    })

                    if (!stripeResponse.ok) {
                        const errorData = await stripeResponse.json().catch(() => ({ error: 'Payment service unavailable' }))
                        clearTimeout(timeoutId)
                        console.error('[Checkout] Stripe session failed:', errorData)
                        toast.error("Payment could not be initialized: " + (errorData.error || "Please try again."))
                        setIsProcessing(false)
                        return
                    }

                    const { url, sessionId } = await stripeResponse.json()

                    if (!url) {
                        clearTimeout(timeoutId)
                        toast.error("Payment gateway returned an invalid response. Please try again.")
                        setIsProcessing(false)
                        return
                    }

                    // Step 2: Stripe session created — create order via server API
                    const orderRes = await fetch('/api/checkout/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderPayload, stripeSessionId: sessionId })
                    })

                    if (!orderRes.ok) {
                        const errData = await orderRes.json().catch(() => ({}))
                        clearTimeout(timeoutId)
                        console.error('[Checkout] Order creation failed after Stripe:', errData)
                        toast.error("Order could not be saved. Please contact support.")
                        setIsProcessing(false)
                        return
                    }

                    const { order: orderData } = await orderRes.json()

                    if (!orderData) {
                        clearTimeout(timeoutId)
                        toast.error("Order could not be saved. Please contact support.")
                        setIsProcessing(false)
                        return
                    }

                    // Step 2b: Deduct stock for card payments too
                    try {
                        const stockResponse = await fetch('/api/orders/deduct-stock', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: (orderData as any).id,
                                items: cartItems.map(item => ({
                                    product_id: item.product_id,
                                    quantity: item.quantity,
                                    product_name: item.product_name
                                }))
                            })
                        })
                        if (!stockResponse.ok) {
                            console.warn('[Checkout] Stock deduction failed for card order:', stockResponse.status)
                        } else {
                            const stockResult = await stockResponse.json()
                            console.log('[Checkout] Stock deduction results:', stockResult)
                        }
                    } catch (stockErr) {
                        console.warn('[Checkout] Stock deduction request failed:', stockErr)
                    }

                    // Step 3: Redirect to Stripe (clear coupon from session - order is saved)
                    if (appliedCoupon) {
                        try {
                            const { data: cpn } = await (supabase.from('coupons') as any)
                                .select('used_count').eq('code', appliedCoupon.code).single()
                            await (supabase.from('coupons') as any)
                                .update({ used_count: (cpn?.used_count || 0) + 1 })
                                .eq('code', appliedCoupon.code)
                        } catch {}
                        sessionStorage.removeItem('appliedCoupon')
                    }
                    clearTimeout(timeoutId)
                    toast.success("Redirecting to payment...")
                    window.location.href = url
                    return
                } catch (stripeError: any) {
                    clearTimeout(timeoutId)
                    console.error('[Checkout] Stripe error:', stripeError.message)
                    toast.error("Payment failed. Please check your connection and try again.")
                    setIsProcessing(false)
                    return
                }
            }

            // ✅ OFFLINE PAYMENT (admin/sales only): Create order via server API
            const offlineOrderRes = await fetch('/api/checkout/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderPayload })
            })

            if (!offlineOrderRes.ok) {
                const errData = await offlineOrderRes.json().catch(() => ({}))
                clearTimeout(timeoutId)
                console.error('Order creation error:', errData)
                toast.error("Failed to create order: " + (errData.error || "Unknown error"))
                setIsProcessing(false)
                return
            }

            const { order: orderData } = await offlineOrderRes.json()

            if (!orderData) {
                clearTimeout(timeoutId)
                toast.error("Failed to create order. Please try again.")
                setIsProcessing(false)
                return
            }

            // 2. Reduce stock for each product via server API (offline payment only)
            try {
                const stockResponse = await fetch('/api/orders/deduct-stock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        orderId: (orderData as any).id,
                        items: cartItems.map(item => ({
                            product_id: item.product_id,
                            quantity: item.quantity,
                            product_name: item.product_name
                        }))
                    })
                })

                if (!stockResponse.ok) {
                    console.warn('⚠️ Stock reduction API failed:', stockResponse.status)
                } else {
                    const stockResult = await stockResponse.json()
                    console.log('✅ Stock deduction results:', stockResult)
                    
                    if (stockResult.success) {
                        console.log('✅ All stock deductions successful')
                    } else {
                        console.warn('⚠️ Some stock deductions failed:', stockResult.results)
                    }
                }
            } catch (stockErr) {
                console.warn('⚠️ Stock reduction request failed:', stockErr)
            }

            // 3. Clear cart
            try {
                await clearCart()
                console.log('✅ Cart cleared')
            } catch (cartError) {
                console.warn('⚠️ Cart clear failed but order was created:', cartError)
            }

            // 4. Increment coupon used_count if coupon was applied
            if (appliedCoupon) {
                try {
                    const { data: cpn } = await (supabase.from('coupons') as any)
                        .select('used_count').eq('code', appliedCoupon.code).single()
                    await (supabase.from('coupons') as any)
                        .update({ used_count: (cpn?.used_count || 0) + 1 })
                        .eq('code', appliedCoupon.code)
                } catch {}
                sessionStorage.removeItem('appliedCoupon')
            }

            // 5. Clear timeout and show success
            clearTimeout(timeoutId)
            toast.success("Order placed successfully! 🎉")
            
            console.log('✅ Redirecting to success page...')
            // Small delay before redirect to allow success message to display
            setTimeout(() => {
                router.push(`/order/success?orderId=${(orderData as any).order_number}`)
            }, 1500)
        } catch (err) {
            clearTimeout(timeoutId)
            console.error("Checkout error:", err)
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
            toast.error(errorMessage)
            setIsProcessing(false)
        }
    }

    // Not logged in state - handled by server, but kept as fallback
    if (!isLoggedIn) {
        return (
            <div className="text-center py-16">
                <h1 className="text-3xl font-bold text-primary mb-4">Please login to checkout</h1>
                <p className="text-muted-foreground mb-8">You need to be logged in to proceed to checkout.</p>
                <Button asChild>
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        )
    }

    if (cartLoading) {
        return (
            <div className="text-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your cart...</p>
                <p className="text-xs text-muted-foreground mt-4">If this takes too long, please <button onClick={() => router.refresh()} className="underline text-primary">refresh the page</button></p>
            </div>
        )
    }

    if (cartItems.length === 0) {
        return (
            <div className="text-center py-16">
                <h1 className="text-3xl font-bold text-primary mb-4">Your cart is empty</h1>
                <p className="text-muted-foreground mb-8">Add items to your cart before checkout.</p>
                <Button asChild>
                    <Link href="/tiles">Browse Products</Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            <h1 className="text-3xl font-serif font-bold text-primary mb-8">Checkout</h1>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Order Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Billing Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                                    <Input required placeholder="John Doe" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email *</label>
                                    <Input type="email" required placeholder="john@example.com" name="email" value={formData.email} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Phone *</label>
                                    <Input type="tel" required placeholder="+353 1 234 5678" name="phone" value={formData.phone} onChange={handleInputChange} />
                                </div>

                            </CardContent>
                        </Card>

                        {/* Saved Addresses Section */}
                        {addresses.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        Saved Addresses
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {addresses.map((address) => (
                                        <button
                                            key={address.id}
                                            type="button"
                                            onClick={() => handleAddressSelection(address.id)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                                selectedAddressId === address.id
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-semibold text-sm text-foreground">{address.full_name}</div>
                                                    <div className="text-sm text-muted-foreground mt-0.5">{address.street}</div>
                                                    <div className="text-sm text-muted-foreground">{address.city}, {address.state} {address.pincode}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">{address.phone}</div>
                                                </div>
                                                <div
                                                    className={`w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                                                        selectedAddressId === address.id
                                                            ? 'bg-primary shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]'
                                                            : 'bg-[#E5E9F0] shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.9)]'
                                                    }`}
                                                >
                                                    {selectedAddressId === address.id && (
                                                        <svg
                                                            className="w-2.5 h-2.5 text-white"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="3"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            {address.is_default && (
                                                <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Default</span>
                                            )}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAddressId("")
                                            setUseNewAddress(true)
                                            setFormData(prev => ({ ...prev, street: "", city: "", state: "", pincode: "" }))
                                        }}
                                        className={`w-full p-4 rounded-lg border-2 border-dashed text-sm font-medium transition-all ${
                                            !selectedAddressId
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-border text-muted-foreground hover:border-primary/40'
                                        }`}
                                    >
                                        + Enter a new address
                                    </button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Delivery Address */}
                        <Card key={`delivery-${selectedAddressId || 'new'}`}>
                            <CardHeader>
                                <CardTitle>Delivery Address</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Street Address *</label>
                                    <Input required placeholder="123 Main Street" name="street" value={formData.street} onChange={handleInputChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">City *</label>
                                        <Input required placeholder="Dublin" name="city" value={formData.city} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">County/State *</label>
                                        <Input required placeholder="Dublin" name="state" value={formData.state} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Postal Code *</label>
                                        <Input required placeholder="D02 XY12" name="pincode" value={formData.pincode} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Method</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border border-border rounded-lg p-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="payment" 
                                            value="card" 
                                            checked={formData.payment === 'card'} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, payment: e.target.value }))}
                                            className="w-4 h-4" 
                                        />
                                        <span className="font-medium">Credit/Debit Card</span>
                                    </label>
                                </div>
                                {(userRole === 'admin' || userRole === 'sales') && (
                                    <div className="border border-border rounded-lg p-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="payment" 
                                                value="offline_cash" 
                                                checked={formData.payment === 'offline_cash'} 
                                                onChange={(e) => setFormData(prev => ({ ...prev, payment: e.target.value }))}
                                                className="w-4 h-4" 
                                            />
                                            <span className="font-medium">Offline Cash Payment</span>
                                            <span className="text-xs text-muted-foreground">(Pay in store)</span>
                                        </label>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 mb-6">
                                    {cartItems.slice(0, 3).map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={item.product_image || '/images/placeholder.jpg'}
                                                    alt={item.product_name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-2">{item.product_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Qty: {item.quantity}
                                                </p>
                                                <p className="text-sm font-bold text-primary mt-1">
                                                    {formatPrice(item.product_price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {cartItems.length > 3 && (
                                        <p className="text-sm text-muted-foreground text-center">
                                            +{cartItems.length - 3} more item(s)
                                        </p>
                                    )}
                                </div>

                                <div className="border-t border-border pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    {couponDiscount > 0 && appliedCoupon && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-600 flex items-center gap-1">
                                                <Tag className="h-3 w-3" />
                                                Coupon ({appliedCoupon.code})
                                            </span>
                                            <span className="font-semibold text-green-600">-{formatPrice(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">VAT (23%)</span>
                                        <span className="font-medium">{formatPrice(tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-medium">
                                            {shippingFee === 0 ? <span className="text-green-600">Free</span> : formatPrice(shippingFee)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
                                        <span>Total</span>
                                        <span className="text-primary">{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full mt-6 bg-primary hover:bg-primary-dark text-white h-12 text-lg font-semibold"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Place Order"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </>
    )
}
