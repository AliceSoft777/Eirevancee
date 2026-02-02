"use client"

import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

export default function FAQPage() {
    return (
        <>
            <SiteHeader />

            <main className="bg-background min-h-screen">
                <div className="container mx-auto max-w-[900px] px-4 py-12">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-primary mb-4">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Find answers to common questions about our products, services, and policies
                        </p>
                    </div>

                    {/* FAQ Accordion */}
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pt-2 pb-4">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    {/* Contact CTA */}
                    <div className="mt-12 bg-secondary/5 p-8 rounded-lg text-center border border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h2>
                        <p className="text-muted-foreground mb-6">
                            Our team is here to help! Get in touch and we&apos;ll be happy to assist you.
                        </p>
                        <Button className="bg-primary hover:bg-primary-dark text-white" asChild>
                            <Link href="/contact">Contact Us</Link>
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}
