"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCart } from "@/hooks/useCart"
import { useAddresses } from "@/hooks/useAddresses"
import { formatPrice } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/supabase-types"

interface CheckoutClientProps {
    isLoggedIn: boolean
}

export default function CheckoutClient({ isLoggedIn }: CheckoutClientProps) {
    const supabase = getSupabaseBrowserClient()
    const { cartItems, isLoading: cartLoading, clearCart, getCartTotal } = useCart()
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [couponCode, setCouponCode] = useState("")
    const [userId, setUserId] = useState<string | null>(null)

    // ✅ NEW: Fetch saved addresses
    const { addresses, isLoading: addressesLoading } = useAddresses(userId)
    const [selectedAddressId, setSelectedAddressId] = useState<string>("")
    const [useNewAddress, setUseNewAddress] = useState(true)

    // ✅ BULLETPROOF: Single source of truth for form data (Aligned with DB schema)
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
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

    const subtotal = getCartTotal()
    const TAX_RATE = 0.23 // 23% VAT for Ireland
    const SHIPPING_THRESHOLD = 100
    const SHIPPING_FEE = 10

    const tax = subtotal * TAX_RATE
    const shippingFee = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const total = subtotal + tax + shippingFee

    // ✅ NEW: Get current user on mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                // Pre-fill email from user object
                if (user.email) {
                    setFormData(prev => ({ ...prev, email: user.email! }))
                }
            }
        }
        getUser()
    }, [])

    // ✅ BULLETPROOF: Auto-fill form via State Update (Using exact DB fields)
    const handleAddressSelection = (addressId: string) => {
        setSelectedAddressId(addressId)
        const address = addresses.find(a => a.id === addressId)
        
        if (address) {
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
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsProcessing(true)

        // Set timeout to prevent infinite loading (30 seconds)
        const timeoutId = setTimeout(() => {
            setIsProcessing(false)
            toast.error("Checkout took too long. Please try again.")
        }, 30000)

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
                toast.error("Please fill in all required fields")
                setIsProcessing(false)
                return
            }

            // Use cached userId from state (fetched on mount) - avoids AbortError
            if (!userId) {
                clearTimeout(timeoutId)
                toast.error("You must be logged in to place an order")
                router.push("/login")
                setIsProcessing(false)
                return
            }

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

            // ✅ Just INSERT new address (don't upsert - no unique constraint exists)
            const { data: addressData, error: addressError } = await (supabase
                .from('customer_addresses') as any)
                .insert([addressPayload])
                .select()

            if (addressError) {
                console.warn('[Checkout] ⚠️  Address save failed (non-blocking):', {
                    message: addressError.message,
                    code: addressError.code,
                    details: addressError.details,
                    hint: addressError.hint
                })
                // ✅ NON-BLOCKING: Order creation continues
            } else {
                console.log('[Checkout] ✅ Address saved to customer_addresses', {
                    id: (addressData as any)?.[0]?.id,
                    user_id: (addressData as any)?.[0]?.user_id,
                    full_name: (addressData as any)?.[0]?.full_name,
                    created_at: (addressData as any)?.[0]?.created_at
                })
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

            // 1. Create order record with CORRECT payload
            const orderPayload = {
                user_id: userId,
                customer_id: userId,
                customer_name: full_name,
                customer_email: email,
                customer_phone: phone,
                subtotal: Number(subtotal.toFixed(2)),
                tax: Number(tax.toFixed(2)),
                shipping_fee: Number(shippingFee.toFixed(2)),
                discount: 0,
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

            const { data: orderData, error: orderError } = await (supabase
                .from('orders') as any)
                .insert(orderPayload)
                .select()
                .single()

            if (orderError || !orderData) {
                clearTimeout(timeoutId)
                console.error('Order creation error:', orderError)
                toast.error("Failed to create order: " + (orderError?.message || "Unknown error"))
                setIsProcessing(false)
                return
            }

            console.log('✅ Order created successfully:', (orderData as any).id)

            // 2. Reduce stock for each product via server API
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

            // 4. Clear timeout and show success
            clearTimeout(timeoutId)
            toast.success("Order placed successfully! 🎉")
            
            console.log('✅ Redirecting to success page...')
            // Small delay before redirect to allow success message to display
            setTimeout(() => {
                router.push(`/payment/success?orderId=${(orderData as any).id}`)
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
                                <div>
                                    <label className="block text-sm font-medium mb-2">Coupon Code (Optional)</label>
                                    <Input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Enter coupon code"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* ✅ NEW: Saved Addresses Section */}
                        {addresses.length > 0 && (
                            <Card className="border-2 border-blue-200 bg-blue-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span>📍 Your Saved Addresses</span>
                                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Quick Select</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {addresses.map((address) => (
                                        <button
                                            key={address.id}
                                            type="button"
                                            onClick={() => handleAddressSelection(address.id)}
                                            className={`w-full text-left p-4 border-2 rounded-lg transition ${
                                                selectedAddressId === address.id
                                                    ? 'border-blue-500 bg-blue-100 shadow-md'
                                                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-900">{address.full_name}</div>
                                            <div className="text-sm text-gray-700">{address.street}</div>
                                            <div className="text-sm text-gray-600">{`${address.city}, ${address.state} ${address.pincode}`}</div>
                                            <div className="text-xs text-gray-500 mt-1">{`📞 ${address.phone}`}</div>
                                        </button>
                                    ))}
                                    
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAddressId("")
                                            setUseNewAddress(true)
                                            // Optional: Clear form when choosing "Enter New Address"
                                            // setFormData(prev => ({ ...prev, firstName: "", lastName: "", address1: "", address2: "", city: "", county: "", postcode: "", phone: "" }))
                                        }}
                                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition text-center font-medium"
                                    >
                                        ➕ Enter New Address
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
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Final total (including delivery & taxes) will be calculated at backend
                                    </p>
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
