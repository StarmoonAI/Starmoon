"use client";

import { useEffect } from "react";
import Image from "next/image";
import Product1 from "@/public/images/decomposation_view.gif";
import Product2 from "@/public/images/front_view.png";

// Import Swiper
import Swiper from "swiper";
import { Pagination, EffectFade } from "swiper/modules";
// import Swiper and modules styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import TestCharacter, { TestCharacterProps } from "./TestCharacter";
Swiper.use([Pagination, EffectFade]);

interface ITestCharacter {
    toy_id: string;
    character_description: string;
    personality_id: string;
    audio_src: string;
    image_src: string;
}

const testCharacters: ITestCharacter[] = [
    {
        toy_id: "6c3eb71a-8d68-4fc6-85c5-27d283ecabc8",
        personality_id: "f2385cc0-2dd2-482b-81b4-5bc1ebf7f527",
        character_description:
            "Rick is our male-voice. Specialty: Being batman, helping you feel gritty and ready to take on Gotham's criminals.",
        audio_src: "/audio/rick.wav",
        image_src: "papa_john_batman.png",
    },
    {
        toy_id: "14d91296-eb6b-41d7-964c-856a8614d80e",
        personality_id: "1842ec2b-96b1-4349-8c82-e9756ef6c00e",
        character_description:
            "San is our female-voice. Specialty: Your fitness coach whenever you need her to give you a boost.",
        audio_src: "/audio/sandra.wav",
        image_src: "mama_mia_fitness_coach.png",
    },
    {
        toy_id: "56224f7f-250d-4351-84ee-e4a13b881c7b",
        personality_id: "3f7556df-3c95-4bba-a6e0-0058d1dd256c",
        character_description:
            "Aria is our neutral child voice. Specialty: Your eco-champion, helping you make daily environment-friendly choices.",
        audio_src: "/audio/chester.wav",
        image_src: "aria_sherlock.png",
    },
];

interface CharacterPickerProps {
    allToys: IToy[];
    allPersonalities: IPersonality[];
}

export default function CharacterPicker({
    allToys,
    allPersonalities,
}: CharacterPickerProps) {
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
                        <div className="relative max-w-xl gap-8 mx-auto md:max-w-none text-center md:text-left flex flex-col md:flex-row items-center justify-end">
                            {/* Carousel */}
                            <div
                                className="w-full md:w-3/5 md:mr-8 mb-8 md:mb-0 flex-shrink-0 h-[450px] shadow-custom"
                                data-aos="fade-up"
                                data-aos-anchor="[data-aos-id-6]"
                            >
                                <div className="character-carousel swiper-container max-w-sm mx-auto sm:max-w-none h-[450px] rounded-[30px]">
                                    <div className="swiper-wrapper">
                                        {/* corp */}
                                        {/* Card #1 */}
                                        <div className="swiper-slide w-full h-full flex-shrink-0 relative">
                                            <div className="rounded-[30px] overflow-hidden w-full h-full">
                                                <Image
                                                    src={Product1}
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
                                                src={Product2}
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
                                {testCharacters.map((character, index) => (
                                    <TestCharacter
                                        key={index}
                                        {...character}
                                        toy={
                                            allToys.find(
                                                (toy) =>
                                                    toy.toy_id ===
                                                    character.toy_id
                                            )!
                                        }
                                        personality={
                                            allPersonalities.find(
                                                (personality) =>
                                                    personality.personality_id ===
                                                    character.personality_id
                                            )!
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
