import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"

export default function TermsPage() {
    return (
        <>
            <SiteHeader />
            <main className="bg-white min-h-screen">
                <div className="container mx-auto max-w-[900px] px-4 py-12">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-tm-text mb-8">
                        Terms & Conditions
                    </h1>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <p className="text-tm-text-muted">Last updated: December 2025</p>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">1. Introduction</h2>
                            <p className="text-tm-text-muted">
                                These Terms and Conditions govern your use of the Tile Merchant website and the purchase of products
                                from Tile Merchant. By using our website and placing orders, you agree to these terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">2. Orders and Payment</h2>
                            <p className="text-tm-text-muted mb-3">
                                All orders are subject to acceptance and availability. We reserve the right to refuse any order.
                            </p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Prices are in Euros (€) and include VAT where applicable</li>
                                <li>• Payment must be made in full before delivery unless credit terms agreed</li>
                                <li>• We accept all major credit/debit cards and PayPal</li>
                                <li>• Prices may change without notice but confirmed orders remain at quoted price</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">3. Delivery</h2>
                            <p className="text-tm-text-muted">
                                Delivery times are estimates and not guaranteed. We are not liable for delays outside our control.
                                See our Delivery Information page for full details.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">4. Returns and Refunds</h2>
                            <p className="text-tm-text-muted">
                                Returns are accepted within 30 days subject to our Returns Policy. Custom-made and cut-to-size
                                items cannot be returned unless faulty.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">5. Product Information</h2>
                            <p className="text-tm-text-muted">
                                We strive to ensure product information is accurate. However, manufacturers may change specifications
                                without notice. Colors may appear differently on screen. We recommend ordering samples before large purchases.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">6. Limitation of Liability</h2>
                            <p className="text-tm-text-muted">
                                Our liability to you is limited to the purchase price of the products. We are not liable for any
                                indirect or consequential losses, including installation costs or loss of business.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">7. Intellectual Property</h2>
                            <p className="text-tm-text-muted">
                                All content on this website, including images, text, and logos, is the property of Tile Merchant
                                and protected by copyright laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">8. Governing Law</h2>
                            <p className="text-tm-text-muted">
                                These terms are governed by Irish law. Any disputes will be subject to the exclusive jurisdiction
                                of the Irish courts.
                            </p>
                        </section>

                        <section className="bg-tm-bg-muted p-6 rounded-lg">
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Contact Us</h2>
                            <p className="text-tm-text-muted">
                                For questions about these terms, please contact us at{' '}
                                <a href="mailto:legal@tilemerchant.ie" className="text-tm-red hover:underline">legal@tilemerchant.ie</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}

