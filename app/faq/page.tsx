import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession, getNavData, getCartData, getWishlistData, getProducts } from "@/lib/loaders"

const faqs = [
    {
        question: "What are your delivery charges?",
        answer: "We offer free delivery on all orders over €100. For orders under €100, a standard delivery charge of €9.99 applies. Delivery times typically range from 2-5 business days depending on your location."
    },
    {
        question: "Do you offer trade accounts?",
        answer: "Yes! We offer competitive trade pricing for contractors, builders, and interior designers. Contact our team to set up your trade account and start enjoying exclusive discounts and benefits."
    },
    {
        question: "Can I visit your showroom?",
        answer: "Absolutely! We welcome you to visit our showroom at 123 Main Street, Dublin. Our showroom is open Monday-Friday 9am-6pm and Saturday 10am-4pm. No appointment necessary."
    },
    {
        question: "What is your returns policy?",
        answer: "We offer a 30-day return policy on unopened, unused products in their original packaging. Custom-ordered items and cut tiles cannot be returned. Please see our Returns Policy page for full details."
    },
    {
        question: "Do you price match?",
        answer: "Yes! If you find the same product cheaper elsewhere in Ireland, we'll match the price. Simply show us proof of the lower price and we'll beat it where possible."
    },
    {
        question: "How do I calculate how many tiles I need?",
        answer: "Measure the length and width of your area in meters and multiply them together to get the square meterage. We recommend adding 10% extra for cuts and wastage. Our team can help you calculate the exact amount needed."
    },
    {
        question: "Do you offer installation services?",
        answer: "While we don't provide installation directly, we work with a network of trusted, qualified tradespeople who we can recommend for your project."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit and debit cards, PayPal, and bank transfers. Trade accounts can also pay on account with approved credit terms."
    },
    {
        question: "Can I order samples?",
        answer: "Yes! We offer sample tiles for a small fee (refunded on purchase). This allows you to see and feel the product in your space before committing to a full order."
    },
    {
        question: "How do I track my order?",
        answer: "Once your order ships, you'll receive a tracking number via email. You can use this to track your delivery in real-time through our courier's website."
    }
]

export const dynamic = "force-dynamic";

export default async function FAQPage() {
   const [session, { categories }, { products }] = await Promise.all([
     getServerSession(),
     getNavData(),
     getProducts()
   ])
   const [{ cartCount }, { wishlistCount }] = await Promise.all([
     getCartData(session.userId),
     getWishlistData(session.userId)
   ])

    return (
        <>
            <SiteHeader 
              session={session} 
              categories={categories} 
              products={products}
              initialCartCount={cartCount} 
              initialWishlistCount={wishlistCount} 
            />

            <main className="bg-[#E5E9F0] min-h-screen">
                <div className="container mx-auto max-w-[1000px] px-4 py-12">
                   
                    {/* FAQ Main Card */}
                    <div className="bg-[#E5E9F0] neu-raised rounded-[2.5rem] p-8 md:p-16 border border-white/40">
                        <div className="text-center mb-16">
                            <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-slate-800 mb-6">
                                Frequently Asked Questions
                            </h1>
                            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                                Find answers to common questions about our products, services, and policies
                            </p>
                        </div>

                        {/* FAQ Accordion - Custom Styled */}
                        <Accordion type="single" collapsible className="space-y-6">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border-none">
                                    <div className="bg-[#E5E9F0] neu-raised rounded-2xl border border-white/60 overflow-hidden hover:translate-y-[-2px] transition-transform duration-300">
                                        <AccordionTrigger className="text-left font-bold text-slate-800 hover:text-primary px-6 py-4 hover:no-underline text-lg">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-600 px-6 pb-6 pt-2 leading-relaxed bg-white/30 text-base">
                                            {faq.answer}
                                        </AccordionContent>
                                    </div>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        {/* Contact CTA */}
                        <div className="mt-16 bg-[#E5E9F0] neu-inset p-8 md:p-12 rounded-[2.5rem] text-center border-t border-white/50">
                            <h2 className="text-3xl font-bold text-slate-800 mb-4 font-serif">Still have questions?</h2>
                            <p className="text-slate-600 mb-8 max-w-xl mx-auto text-lg">
                                Our team is here to help! Get in touch and we&apos;ll be happy to assist you with any query.
                            </p>
                            <Button className="bg-primary hover:bg-primary-dark text-white rounded-2xl h-14 px-8 text-lg font-bold shadow-lg hover:shadow-xl transition-all" asChild>
                                <Link href="/contact">Contact Our Team</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer categories={categories} />
        </>
    )
}
