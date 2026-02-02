"use client";

import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  "Our Store": [
    { name: "Clearance", href: "/clearance" },
    { name: "Tiles", href: "/tiles" },
    { name: "Outdoor", href: "/outdoor" },
    { name: "Wall Panelling", href: "/wall-panelling" },
    { name: "Flooring", href: "/flooring" },
    { name: "Bathrooms", href: "/bathrooms" },
    { name: "Accessories", href: "/accessories" },
  ],
  "Useful Links": [
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
    { name: "Delivery Information", href: "/delivery" },
    { name: "Returns Policy", href: "/returns" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "FAQs", href: "/faq" },
  ],
  "My Account": [
    { name: "Login", href: "/login" },
    { name: "Register", href: "/register" },
    { name: "My Orders", href: "/account/orders" },
    { name: "My Wishlist", href: "/wishlist" },
    { name: "Track Order", href: "/track" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-50 via-white to-tm-bg-muted border-t border-primary/20">
      <div className="container mx-auto max-w-[1400px] px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Our Store */}
          <div>
            <h3 className="text-base font-bold uppercase tracking-widest mb-6 text-primary border-b border-primary/10 pb-2 inline-block">
              Our Store
            </h3>
            <ul className="space-y-3">
              {footerLinks["Our Store"].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-base font-bold uppercase tracking-widest mb-6 text-primary border-b border-primary/10 pb-2 inline-block">
              Useful Links
            </h3>
            <ul className="space-y-3">
              {footerLinks["Useful Links"].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h3 className="text-base font-bold uppercase tracking-widest mb-6 text-primary border-b border-primary/10 pb-2 inline-block">
              My Account
            </h3>
            <ul className="space-y-3">
              {footerLinks["My Account"].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-base font-bold uppercase tracking-widest mb-6 text-primary border-b border-primary/10 pb-2 inline-block">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="p-2 bg-primary/5 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Call Us
                  </p>
                  <a
                    href="tel:+353123456789"
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors block mt-0.5"
                  >
                    +353 1 234 5678
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="p-2 bg-primary/5 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Email Us
                  </p>
                  <a
                    href="mailto:info@celtictiles.ie"
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors block mt-0.5"
                  >
                    info@celtictiles.ie
                  </a>
                </div>
              </li>
              <li className="pt-2">
                <Button className=" w-full bg-primary hover:bg-primary-dark text-white font-semibold tracking-wide">
                  <MapPin className="h-4 w-4 mr-2" />
                  Find a Showroom
                </Button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Celtic Tiles. All rights reserved.
            </p>
            <div className="flex items-center gap-4 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              {/* Payment icons would go here */}
              <span className="text-xs text-muted-foreground">
                Secure Payments
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
