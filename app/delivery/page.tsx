import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"

export default function DeliveryPage() {
    return (
        <>
            <SiteHeader />
            <main className="bg-white min-h-screen">
                <div className="container mx-auto max-w-[900px] px-4 py-12">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-tm-text mb-8">
                        Delivery Information
                    </h1>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Delivery Charges</h2>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• <strong>FREE delivery</strong> on all orders over €100</li>
                                <li>• <strong>€9.99 delivery</strong> for orders under €100</li>
                                <li>• Delivery charges calculated at checkout</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Delivery Times</h2>
                            <p className="text-tm-text-muted mb-4">
                                Standard delivery times across Ireland:
                            </p>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Dublin area: 2-3 business days</li>
                                <li>• Rest of Ireland: 3-5 business days</li>
                                <li>• Express delivery available (additional charges apply)</li>
                            </ul>
                            <p className="text-tm-text-muted mt-4">
                                Please note that delivery times may be slightly longer for large or bulky orders.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Order Tracking</h2>
                            <p className="text-tm-text-muted">
                                Once your order is dispatched, you&apos;ll receive a confirmation email with a tracking number.
                                You can use this to track your delivery in real-time through our courier&apos;s website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Delivery Process</h2>
                            <ol className="space-y-2 text-tm-text-muted list-decimal list-inside">
                                <li>Order confirmed and processed</li>
                                <li>Items picked and packed at our warehouse</li>
                                <li>Dispatch notification sent with tracking details</li>
                                <li>Courier delivers to your specified address</li>
                                <li>Signature required on delivery</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Important Notes</h2>
                            <ul className="space-y-2 text-tm-text-muted">
                                <li>• Please inspect all items upon delivery</li>
                                <li>• Report any damage to the courier immediately</li>
                                <li>• Keep original packaging for potential returns</li>
                                <li>• Someone must be present to sign for delivery</li>
                                <li>• Safe place delivery not available for tiles/heavy items</li>
                            </ul>
                        </section>

                        <section className="bg-tm-bg-muted p-6 rounded-lg">
                            <h2 className="text-2xl font-bold text-tm-text mb-4">Need Help?</h2>
                            <p className="text-tm-text-muted">
                                If you have any questions about delivery, please contact our customer service team at{' '}
                                <a href="tel:+353123456 78" className="text-tm-red hover:underline">353870007777</a> or{' '}
                                <a href="mailto:info@celtictiles.ie" className="text-tm-red hover:underline">info@celtictiles.ie</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}

