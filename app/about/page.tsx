import { CheckCircle } from "lucide-react";

export default function AboutPage() {
  const features = [
    "Wide range of premium products",
    "Competitive pricing with price match guarantee",
    "Expert advice from knowledgeable staff",
    "Fast delivery across Ireland",
    "Showroom with thousands of samples",
    "Trade accounts available",
  ];

  const values = [
    {
      title: "Quality",
      description: "We source only the finest products from trusted manufacturers to ensure durability and style.",
    },
    {
      title: "Service",
      description: "Our knowledgeable team is here to guide you through every step of your project.",
    },
    {
      title: "Value",
      description: "Competitive prices and special offers ensure you get the best value for your money.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#E5E9F0]">
      {/* Hero Section */}
      <section className="py-20 bg-[#E5E9F0]">
        <div className="container mx-auto max-w-[1400px] px-6">
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-tm-text mb-4">
              ABOUT CELTIC TILES
            </h1>
            <p className="text-xl text-tm-text-muted max-w-3xl mx-auto">
              Ireland's leading supplier of quality tiles, flooring, and bathroom products
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-[1400px] px-6">
          <h2 className="text-4xl font-bold text-tm-text mb-8">Our Story</h2>
          <div className="space-y-6 text-lg text-tm-text-muted max-w-4xl">
            <p>
              Celtic Tiles is a traditional irish company driven by creativity and an endless passion for helping you find the perfect tile for your project. Each person on our team is eager to develop a long lasting relationship with you. We are a strong, personality-driven brand that's carved a unique niche in the renovation and interior design landscape, with a customer experience that remains unmatched in style, service, and selection.
            </p>
            <p>
              Our goal is to deliver you endless inspiration and the perfect tile pairing for your design project. We can't wait to work together and make you a part of our family today.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-[#E5E9F0]">
        <div className="container mx-auto max-w-[1400px] px-6">
          <h2 className="text-4xl font-bold text-tm-text text-center mb-16">
            Why Choose Celtic Tiles?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-tm-red flex-shrink-0 mt-1" />
                <p className="text-lg text-tm-text font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-[1400px] px-6">
          <h2 className="text-4xl font-bold text-tm-text mb-16">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {values.map((value, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-2xl font-bold text-tm-red">{value.title}</h3>
                <p className="text-lg text-tm-text-muted leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
