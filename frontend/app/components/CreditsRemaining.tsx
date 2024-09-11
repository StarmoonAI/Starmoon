import { getCreditsRemaining } from "@/lib/utils";

const CreditsRemaining: React.FC<{ user: IUser }> = ({ user }) => {
    const creditsRemaining = getCreditsRemaining(user);
    return (
        <p className="text-sm text-gray-600">
            {creditsRemaining} credits remaining
        </p>
    );
};

export default CreditsRemaining;
