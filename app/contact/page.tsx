"use client"

import { SiteHeader } from "@/components/layout/site-header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
    return (
        <>
            <SiteHeader />

            <main className="bg-background min-h-screen">
                <div className="container mx-auto max-w-[1200px] px-4 py-12">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-primary mb-4">
                            Contact Us
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Have a question? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-6">Get In Touch</h2>

                            <div className="space-y-6">
                                {/* Phone */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/5 p-3 rounded-lg text-primary">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                                        <p className="text-muted-foreground">+353 14090558</p>
                                        <p className="text-sm text-muted-foreground">Mon-Fri 9am-6pm, Sat 10am-4pm</p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/5 p-3 rounded-lg text-primary">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">Email</h3>
                                        <p className="text-muted-foreground">contact@tilemerchant.ie</p>
                                        <p className="text-sm text-muted-foreground">We&apos;ll respond within 24 hours</p>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/5 p-3 rounded-lg text-primary">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">Showroom Address</h3>
                                        <p className="text-muted-foreground">Besides AXA insurance, Finches Industrial Park, Long Mile Rd, Walkinstown</p>
                                        <p className="text-muted-foreground">Dublin, D12 FP74, Ireland</p>
                                    </div>
                                </div>

                                {/* Opening Hours */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/5 p-3 rounded-lg text-primary">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">Opening Hours</h3>
                                        <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                                        <p className="text-muted-foreground">Saturday: 10:00 AM - 4:00 PM</p>
                                        <p className="text-muted-foreground">Sunday: Closed</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-secondary/5 p-8 rounded-lg border border-border">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>
                            <form className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full px-4 py-2 border border-input rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-2 border border-input rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="w-full px-4 py-2 border border-input rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={5}
                                        className="w-full px-4 py-2 border border-input rounded-none focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
                                        required
                                    />
                                </div>

                                <Button variant="default" size="lg" className="w-full bg-primary hover:bg-primary-dark text-white">
                                    Send Message
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}
