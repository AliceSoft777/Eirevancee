"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "swiper/css"
import "swiper/css/navigation"

interface CircleCategory {
    name: string
    href: string
    image: string
}

interface CircleCategoryCarouselProps {
    title?: string
    categories: CircleCategory[]
}

export function CircleCategoryCarousel({ title, categories }: CircleCategoryCarouselProps) {
    const prevRef = useRef<HTMLButtonElement>(null)
    const nextRef = useRef<HTMLButtonElement>(null)

    return (
        <section className="py-20 bg-[#E5E9F0]">
            <div className="container mx-auto max-w-[1400px] px-6">
                {title && (
                    <h2 className="font-serif text-3xl md:text-4xl font-bold uppercase tracking-wider text-center mb-12 text-tm-text">
                        {title}
                    </h2>
                )}

                <div className="relative">
                    <button
                        ref={prevRef}
                        className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full neu-raised bg-[#E5E9F0] text-tm-text-muted hover:text-tm-red transition-all disabled:opacity-0"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <button
                        ref={nextRef}
                        className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full neu-raised bg-[#E5E9F0] text-tm-text-muted hover:text-tm-red transition-all disabled:opacity-0"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={10}
                        slidesPerView={5}
                        centeredSlides={categories.length <= 6}
                        centeredSlidesBounds={true}
                        navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                        }}
                        onBeforeInit={(swiper) => {
                            if (typeof swiper.params.navigation !== 'boolean') {
                                const navigation = swiper.params.navigation;
                                if (navigation) {
                                    navigation.prevEl = prevRef.current;
                                    navigation.nextEl = nextRef.current;
                                }
                            }
                        }}
                        breakpoints={{
                            480: { slidesPerView: 4, spaceBetween: 16 },
                            768: { slidesPerView: 5, spaceBetween: 20 },
                            1024: { slidesPerView: 7, spaceBetween: 24 },
                        }}
                    >
                        {categories.map((category) => (
                            <SwiperSlide key={category.name}>
                                <Link href={category.href} className="group block text-center">
                                    <div className="relative w-20 h-20 md:w-28 md:h-28 mb-3 mx-auto p-1.5 rounded-full neu-raised bg-[#E5E9F0] transition-all group-hover:neu-inset">
                                        <div className="relative w-full h-full rounded-full overflow-hidden">
                                            <Image
                                                src={category.image}
                                                alt={category.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                sizes="(max-width: 768px) 80px, 112px"
                                            />
                                        </div>
                                    </div>
                                    <h3 className="text-xs md:text-sm font-semibold text-tm-text group-hover:text-tm-red transition-colors capitalize">
                                        {category.name}
                                    </h3>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    )
}
