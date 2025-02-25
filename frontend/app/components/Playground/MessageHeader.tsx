import Image from "next/image";

interface MessageHeaderProps {
        personalityTranslation: IPersonalitiesTranslation;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({
        personalityTranslation,
}) => {
        return (
                <div className="flex items-center p-4 sm:border-none bg-white rounded-2xl max-w-screen-md mt-2">
                        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                                <Image
                                        src={`/personality/${personalityTranslation.personality_key}.jpeg`}
                                        alt={personalityTranslation.title}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                        priority
                                />
                        </div>
                        <div className="ml-4 flex-grow">
                                <h2 className="font-semibold text-gray-900">
                                        {personalityTranslation.title}
                                </h2>
                                <p className="text-sm text-gray-500">
                                        {personalityTranslation.subtitle}
                                </p>
                        </div>
                </div>
        );
};

export default MessageHeader;
