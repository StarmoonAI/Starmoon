import CreditsRemaining from "./CreditsRemaining";

interface HomePageSubtitlesProps {
    user: IUser;
    page: "home" | "settings" | "track";
}

const HomePageSubtitles: React.FC<HomePageSubtitlesProps> = ({
    user,
    page,
}) => {
    if (user.user_info.user_type === "doctor") {
        if (page === "home") {
            return (
                <p className="text-sm text-gray-600">
                    Use this playground or your device to engage your patients
                </p>
            );
        } else if (page === "track") {
            return (
                <p className="text-sm text-gray-600">
                    Track your patients&apos; progress and trends here
                </p>
            );
        } else {
            return (
                <p className="text-sm text-gray-600">
                    You can update your settings here
                </p>
            );
        }
    }
    return <CreditsRemaining user={user} />;
};

export default HomePageSubtitles;
