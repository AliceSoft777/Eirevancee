import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Clock } from "lucide-react"


export default async function ContactPage() {

    return (
        <>
            <main className="bg-[#E5E9F0] min-h-screen">
                <div className="container mx-auto max-w-[1200px] px-4 py-12">
                    {/* Page Header Card */}
                    <div className="bg-[#E5E9F0] neu-raised rounded-[2.5rem] p-8 md:p-12 border border-white/40 mb-12 text-center">
                        <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-wider text-primary mb-4">
                            Contact Us
                        </h1>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            Have a question? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Information Card */}
                        <div className="bg-[#E5E9F0] neu-raised rounded-[2.5rem] p-8 md:p-10 border border-white/40 h-full">
                            <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4">Get In Touch</h2>

                            <div className="space-y-8">
                                {/* Phone */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#E5E9F0] neu-raised p-4 rounded-2xl text-primary">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <div className="mt-1">
                                        <h3 className="font-bold text-slate-800 mb-1">Phone</h3>
                                        <p className="text-slate-600 font-medium">+353 14090558</p>
                                        {/*<p className="text-sm text-slate-500 mt-1">Mon-Fri 9am-6pm, Sat 10am-4pm</p>*/}
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#E5E9F0] neu-raised p-4 rounded-2xl text-primary">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div className="mt-1">
                                        <h3 className="font-bold text-slate-800 mb-1">Email</h3>
                                        <p className="text-slate-600 font-medium">admin@celtictiles.ie</p>
                                        <p className="text-sm text-slate-500 mt-1">We&apos;ll respond within 24 hours</p>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#E5E9F0] neu-raised p-4 rounded-2xl text-primary">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div className="mt-1">
                                        <h3 className="font-bold text-slate-800 mb-1">Showroom Address</h3>
                                        <p className="text-slate-600">Besides AXA insurance, Finches Industrial Park, Long Mile Rd, Walkinstown</p>
                                        <p className="text-slate-600 font-medium mt-1">Dublin, D12 FP74, Ireland</p>
                                    </div>
                                </div>

                                {/* Opening Hours */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#E5E9F0] neu-raised p-4 rounded-2xl text-primary">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div className="mt-1">
                                        <h3 className="font-bold text-slate-800 mb-1">Opening Hours</h3>
                                        <p className="text-slate-600">Monday - Friday: 8:00 AM - 8:00 PM</p>
                                        <p className="text-slate-600">Saturday: 9:00 AM - 6:00 PM</p>
                                        <p className="text-slate-600 text-red-500 font-medium mt-1">Sunday: 10:00 AM - 5:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form Card */}
                        <div className="bg-[#E5E9F0] neu-raised rounded-[2.5rem] p-8 md:p-10 border border-white/40">
                            <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4">Send Us a Message</h2>
                            <form className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2 ml-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full px-6 py-4 rounded-2xl neu-inset bg-[#E5E9F0] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 placeholder:text-slate-400"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2 ml-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-6 py-4 rounded-2xl neu-inset bg-[#E5E9F0] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 placeholder:text-slate-400"
                                        placeholder="Enter your email address"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2 ml-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="w-full px-6 py-4 rounded-2xl neu-inset bg-[#E5E9F0] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 placeholder:text-slate-400"
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2 ml-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={5}
                                        className="w-full px-6 py-4 rounded-none neu-inset bg-[#E5E9F0] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-slate-800 placeholder:text-slate-400"
                                        placeholder="How can we help you?"
                                        required
                                    />
                                </div>

                                <Button variant="default" size="lg" className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl neu-raised font-bold text-lg tracking-wide shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all">
                                    Send Message
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
