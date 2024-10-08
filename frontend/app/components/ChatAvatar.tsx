import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAssistantAvatar, getUserAvatar } from "@/lib/utils";

interface ChatAvatarProps {
    role: string;
    user: IUser;
    toy: IToy;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({ role, user, toy }) => {
    const imageSrc: string =
        role === "input"
            ? getUserAvatar(user.avatar_url)
            : getAssistantAvatar(toy.image_src!);

    return (
        <Avatar className="h-8 w-8">
            <AvatarImage src={imageSrc} alt="@shadcn" />
            <AvatarFallback className="text-sm">
                {user.email.slice(0, 2)}
            </AvatarFallback>
        </Avatar>
    );
};

export default ChatAvatar;
