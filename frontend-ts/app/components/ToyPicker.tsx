import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ToyPickerProps {
  currentToy?: IToy;
  chooseToy: (toy: IToy) => void;
  allToys: IToy[];
  imageSize: number;
  buttonText: string;
  showHelpText: boolean;
}

const ToyPicker: React.FC<ToyPickerProps> = ({
  currentToy,
  allToys,
  chooseToy,
  imageSize,
  buttonText,
  showHelpText,
}) => {
  const [selectedToy, setSelectedToy] = useState<IToy | undefined>(currentToy);

  const onClickSelectedToy = (toy: IToy) => {
    setSelectedToy(toy);
  };

  return (
    <div className="flex flex-col-reverse gap-8 pb-6">
      <div className="flex md:mt-7 md:flex-row flex-col gap-8 items-center justify-center">
        {allToys.map((toy) => {
          const chosen = selectedToy?.toy_id === toy.toy_id;
          return (
            <div key={toy.toy_id} className="flex flex-col gap-2 ">
              <div
                className={`flex flex-col max-w-[320px] max-h-[320px] gap-2 mb-4 rounded-2xl overflow-hidden cursor-pointer transition-colors duration-200 ease-in-out`}
                onClick={() => onClickSelectedToy(toy)}
              >
                <Image
                  src={"/" + toy.image_src! + ".png"}
                  width={600}
                  height={600}
                  alt={toy.name}
                  className="transition-transform duration-300 ease-in-out scale-90 transform hover:scale-100 hover:-rotate-2"
                />
              </div>
              <div className="flex flex-col gap-3 items-center text-center">
                <div className={`font-baloo2 text-2xl font-medium`}>
                  {toy.name}
                </div>
                {chosen && (
                  <>
                    <div className="font-quicksand max-w-[320px] text-gray-600 text-sm font-normal">
                      {toy.third_person_prompt}
                    </div>
                    <Button
                      onClick={() => {
                        chooseToy(toy);
                      }}
                      variant="primary"
                      className="font-bold text-lg flex flex-row gap-2 items-center"
                    >
                      <span>{buttonText}</span>
                      <ArrowRight strokeWidth={3} size={20} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showHelpText && (
        <p className="flex self-center text-sm">
          (pick your favorite plushie to get started!)
        </p>
      )}
    </div>
  );
};

export default ToyPicker;
