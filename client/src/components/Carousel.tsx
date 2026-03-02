"use client";
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"

const slides = [
  {
    image: `/Delicious Salami Pizza🍕.jpeg`,
    title: 'Delicious Pizza at Your Doorstep',
  },
  {
    image: `/crack burgers -.jpeg`,
    title: 'Mouthwatering Burgers in Minutes',
  },
  {
    image: `/Yetsom Beyaynetu (Ethiopian Combination Platter).jpeg`,
    title: 'Delicious Beyaynet for you and your friends',
  },
];

const CustomCarousel: React.FC<{ fullScreen?: boolean }> = ({ fullScreen }) => {
  return (
    <div
      className={
        fullScreen
          ? "absolute inset-0 w-full h-full [&_[data-slot=carousel]]:h-full [&_[data-slot=carousel-content]]:!h-full [&_[data-slot=carousel-content]>div]:!h-full"
          : "w-full relative"
      }
    >
      <Carousel
        opts={{
          loop: true,
          align: "center",
        }}
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
        className={fullScreen ? "h-full w-full" : "w-full"}
      >
        <CarouselContent className={fullScreen ? "!h-full !ml-0" : ""}>
          {slides.map((slide, index) => (
            <CarouselItem
              key={index}
              className={
                fullScreen
                  ? "!h-screen min-h-screen w-full flex-shrink-0 relative pl-0"
                  : "h-[420px] sm:h-[520px] md:h-[600px] relative"
              }
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
    </div>
  );
};

export default CustomCarousel;
