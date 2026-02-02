import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"

export default function ReturnsPage() {
    return (
        <>
            <SiteHeader />
            <main className="bg-white min-h-screen">
                <div className="container mx-auto max-w-[900px] px-4 py-12">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-tm-text mb-8">
                        Returns Policy
                    </h1>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">30-Day Returns</h2>
                            <p className="text-tm-text-muted">
                                We want you to be completely satisfied with your purchase. If you&apos;re not happy with your order,
                                you can return it within 30 days of delivery for a full refund or exchange.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Return Conditions</h2>
                            <p className="text-tm-text-muted mb-4">To be eligible for a return, items must:</p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Be in their original, unopened packaging</li>
                                <li>• Be unused and in the same condition as received</li>
                                <li>• Include the original receipt or proof of purchase</li>
                                <li>• Not be custom-ordered or cut-to-size items</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Non-Returnable Items</h2>
                            <p className="text-tm-text-muted mb-4">The following items cannot be returned:</p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Custom-ordered or special order products</li>
                                <li>• Cut tiles or made-to-measure items</li>
                                <li>• Opened adhesive or grout products</li>
                                <li>• Sale or clearance items (unless faulty)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">How to Return</h2>
                            <ol className="space-y-2 text-tm-text-muted list-decimal list-inside">
                                <li>Contact our customer service team</li>
                                <li>Receive your return authorization number</li>
                                <li>Package items securely in original packaging</li>
                                <li>Arrange collection or return to showroom</li>
                                <li>Refund processed within 5-10 business days</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Damaged or Faulty Items</h2>
                            <p className="text-tm-text-muted">
                                If you receive damaged or faulty items, please contact us immediately with photos of the damage.
                                We&apos;ll arrange a replacement or refund at no cost to you, including return shipping.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Refunds</h2>
                            <p className="text-tm-text-muted mb-4">
                                Once we receive and inspect your return, we&apos;ll notify you via email. If approved, your refund
                                will be processed to your original payment method within 5-10 business days.
                            </p>
                            <p className="text-tm-text-muted">
                                Delivery charges are non-refundable except in cases of damaged or faulty items.
                            </p>
                        </section>

                        <section className="bg-tm-bg-muted p-6 rounded-lg">
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Questions?</h2>
                            <p className="text-tm-text-muted">
                                For any questions about returns, please contact us at{' '}
                                <a href="tel:+35312345678" className="text-tm-red hover:underline">+353 1 234 5678</a> or{' '}
                                <a href="mailto:returns@tilemerchant.ie" className="text-tm-red hover:underline">returns@tilemerchant.ie</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}

