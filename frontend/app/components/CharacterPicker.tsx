"use client";

import { useEffect } from "react";
import Image from "next/image";
import character02 from "@/public/images/character-02.jpg";
import MamaMia from "@/public/images/mama_mia.png";
import Product2 from "@/public/images/product.png";
import Product1 from "@/public/images/product1.png";
import Aria from "@/public/images/aria.png";
import PapaJohn from "@/public/images/papa_john.png";
import { FiExternalLink } from "react-icons/fi";

// Import Swiper
import Swiper from "swiper";
import { Pagination, EffectFade } from "swiper/modules";
// import Swiper and modules styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
Swiper.use([Pagination, EffectFade]);

export default function CharacterPicker() {
  useEffect(() => {
    const character = new Swiper(".character-carousel", {
      slidesPerView: 1,
      watchSlidesProgress: true,
      effect: "fade",
      fadeEffect: {
        crossFade: true,
      },
      pagination: {
        el: ".character-carousel-pagination",
        clickable: true,
      },
    });
  }, []);

  return (
    <section className="mt-10 md:mt-14" data-aos-id-6>
      <div className="relative max-w-7xl mx-auto">
        {/* Bg */}
        <div
          className="absolute inset-0 rounded-tl-[100px] mb-24 md:mb-0 bg-gradient-to-b pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="py-8 md:py-12">
            {/* Section content */}
            <div className="relative max-w-xl mx-auto md:max-w-none text-center md:text-left flex flex-col md:flex-row items-center justify-end">
              {/* Carousel */}
              <div
                className="w-full md:w-3/5 md:mr-8 mb-8 md:mb-0 flex-shrink-0 h-[450px] shadow-custom"
                data-aos="fade-up"
                data-aos-anchor="[data-aos-id-6]"
              >
                <div className="character-carousel swiper-container max-w-sm mx-auto sm:max-w-none h-[435px]">
                  <div className="swiper-wrapper">
                    {/* corp */}
                    {/* Card #1 */}
                    <div className="swiper-slide w-full h-full flex-shrink-0 relative">
                      <div className="rounded-[30px] overflow-hidden w-full h-full">
                        <Image
                          src={Product2}
                          alt="Description of the image"
                          // layout="fill"
                          // objectFit="cover"
                          // objectPosition="center"
                          // className="rounded-[30px]"
                          layout="fill"
                          objectFit="contain"
                          objectPosition="center"
                        />
                      </div>
                    </div>

                    {/* corp */}
                    {/* no Card #2 */}
                    <div className="swiper-slide w-full h-full flex-shrink-0 relative">
                      <Image
                        src={Product1}
                        alt="Description of the image"
                        layout="fill"
                        objectFit="contain"
                        objectPosition="center"
                      />
                    </div>
                  </div>
                </div>

                {/* Bullets */}
                <div className="">
                  <div className="character-carousel-pagination text-center" />
                </div>
              </div>

              {/* Content */}
              <div className="w-full md:w-2/5 flex flex-col gap-y-8">
                <div
                  className="flex w-full p-4 bg-white rounded-[30px] gap-x-2  
                    hover:scale-[1.01] transition-all duration-300 ease-in-out cursor-pointer shadow-custom_unfocus"
                >
                  <div className="w-24 h-24 flex-shrink-0 relative">
                    <Image
                      src={Aria}
                      alt="Description of the image"
                      layout="fill"
                      objectFit="cover"
                      objectPosition="center"
                      className="rounded-[30px]"
                    />
                  </div>
                  <div className="text-left py-2 flex flex-col overflow-hidden gap-y-2">
                    <h3 className="text-lg font-medium text-gray-700 truncate flex items-center">
                      Geo guide - Aria{" "}
                      <FiExternalLink className="ml-1 text-sm text-gray-500" />
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 pr-4">
                      Fitness Coach Mama Mia is an enthusiastic and motivating
                      AI fitness coach. She will help you to stay fit and
                      healthy
                    </p>
                  </div>
                </div>

                <div
                  className="flex w-full p-4 bg-white rounded-[30px] gap-x-2  
                    hover:scale-[1.01] transition-all duration-300 ease-in-out cursor-pointer shadow-custom_unfocus"
                >
                  <div className="w-24 h-24 flex-shrink-0 relative">
                    <Image
                      src={MamaMia}
                      alt="Description of the image"
                      layout="fill"
                      objectFit="cover"
                      objectPosition="center"
                      className="rounded-[30px]"
                    />
                  </div>
                  <div className="text-left py-2 flex flex-col overflow-hidden gap-y-2">
                    <h3 className="text-lg font-medium text-gray-700 truncate flex items-center">
                      Art guru - Mama Mia
                      <FiExternalLink className="ml-1 text-sm text-gray-500" />
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 pr-4">
                      Fitness Coach Mama Mia is an enthusiastic and motivating
                      AI fitness coach. She will help you to stay fit and
                      healthy ess coach. She will help you t
                    </p>
                  </div>
                </div>

                <div
                  className="flex w-full p-4 bg-white rounded-[30px] gap-x-2  
                    hover:scale-[1.01] transition-all duration-300 ease-in-out cursor-pointer shadow-custom_unfocus"
                >
                  <div className="w-24 h-24 flex-shrink-0 relative">
                    <Image
                      src={PapaJohn}
                      alt="Description of the image"
                      layout="fill"
                      objectFit="cover"
                      objectPosition="center"
                      className="rounded-[30px]"
                    />
                  </div>
                  <div className="text-left py-2 flex flex-col overflow-hidden gap-y-2">
                    <h3 className="text-lg font-medium text-gray-700 truncate flex items-center">
                      Sherlock - Papa John
                      <FiExternalLink className="ml-1 text-sm text-gray-500" />
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 pr-4">
                      Fitness Coach Mama Mia is an enthusiastic and motivating
                      AI fitness coach. She will help you to stay fit and
                      healthy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
