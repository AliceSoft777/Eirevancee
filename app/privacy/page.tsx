import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"

export default function PrivacyPage() {
    return (
        <>
            <SiteHeader />
            <main className="bg-white min-h-screen">
                <div className="container mx-auto max-w-[900px] px-4 py-12">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-tm-text mb-8">
                        Privacy Policy
                    </h1>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <p className="text-tm-text-muted">Last updated: December 2025</p>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">1. Introduction</h2>
                            <p className="text-tm-text-muted">
                                Tile Merchant (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains
                                how we collect, use, and protect your personal information when you use our website and services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">2. Information We Collect</h2>
                            <p className="text-tm-text-muted mb-3">We may collect the following types of information:</p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Personal details (name, email, phone number, address)</li>
                                <li>• Payment information (processed securely by third-party providers)</li>
                                <li>• Order history and preferences</li>
                                <li>• Website usage data (cookies, IP address, browser type)</li>
                                <li>• Communications with our customer service team</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">3. How We Use Your Information</h2>
                            <p className="text-tm-text-muted mb-3">We use your information to:</p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Process and fulfill your orders</li>
                                <li>• Communicate about your orders and account</li>
                                <li>• Improve our products and services</li>
                                <li>• Send marketing communications (with your consent)</li>
                                <li>• Comply with legal obligations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">4. Cookies</h2>
                            <p className="text-tm-text-muted">
                                We use cookies to enhance your browsing experience, analyze website traffic, and personalize content.
                                You can control cookie settings through your browser, but some features may not work properly if cookies
                                are disabled.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">5. Data Security</h2>
                            <p className="text-tm-text-muted">
                                We implement appropriate security measures to protect your personal information. Payment details are
                                encrypted and processed by secure third-party payment providers. However, no method of transmission
                                over the internet is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">6. Sharing Your Information</h2>
                            <p className="text-tm-text-muted mb-3">We may share your information with:</p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Delivery companies to fulfill your orders</li>
                                <li>• Payment processors to process transactions</li>
                                <li>• Marketing platforms (with your consent)</li>
                                <li>• Law enforcement if required by law</li>
                            </ul>
                            <p className="text-tm-text-muted mt-3">
                                We never sell your personal information to third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">7. Your Rights</h2>
                            <p className="text-tm-text-muted mb-3">Under GDPR, you have the right to:</p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Access your personal data</li>
                                <li>• Correct inaccurate data</li>
                                <li>• Request deletion of your data</li>
                                <li>• Opt-out of marketing communications</li>
                                <li>• Data portability</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">8. Data Retention</h2>
                            <p className="text-tm-text-muted">
                                We retain your personal information for as long as necessary to provide services and comply with
                                legal obligations. Order information is typically retained for 7 years for tax purposes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">9. Changes to This Policy</h2>
                            <p className="text-tm-text-muted">
                                We may update this Privacy Policy from time to time. We&apos;ll notify you of significant changes by
                                email or website notice.
                            </p>
                        </section>

                        <section className="bg-tm-bg-muted p-6 rounded-lg">
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Contact Us</h2>
                            <p className="text-tm-text-muted">
                                For privacy-related questions or to exercise your rights, contact us at 
                                <a href="mailto:privacy@tilemerchant.ie" className="text-tm-red hover:underline">privacy@tilemerchant.ie</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}

