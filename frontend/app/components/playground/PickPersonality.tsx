import DoctorPersonalities from "./DoctorPersonalities";
import UserPersonalities from "./UserPersonalities";

interface PickPersonalityProps {
                onPersonalityPicked: (personalityIdPicked: string) => void;
                allPersonalities: IPersonality[];
                personalityIdState: string;
                currentUser: IUser;
                startCall: (personalityIdSelected: string) => void;
                languageState: LanguageCodeType;
                disableButtons: boolean;
}

const PickPersonality: React.FC<PickPersonalityProps> = ({
                onPersonalityPicked,
                allPersonalities,
                personalityIdState,
                currentUser,
                startCall,
                languageState,
                disableButtons,
}) => {
                if (currentUser.user_info?.user_type === "doctor") {
                                return (
                                                <DoctorPersonalities
                                                                onPersonalityPicked={
                                                                                onPersonalityPicked
                                                                }
                                                                allPersonalities={
                                                                                allPersonalities
                                                                }
                                                                personalityIdState={
                                                                                personalityIdState
                                                                }
                                                                startCall={
                                                                                startCall
                                                                }
                                                                languageState={
                                                                                languageState
                                                                }
                                                                disableButtons={
                                                                                disableButtons
                                                                }
                                                />
                                );
                }

                return (
                                <UserPersonalities
                                                onPersonalityPicked={
                                                                onPersonalityPicked
                                                }
                                                allPersonalities={
                                                                allPersonalities
                                                }
                                                personalityIdState={
                                                                personalityIdState
                                                }
                                                startCall={startCall}
                                                languageState={languageState}
                                                disableButtons={disableButtons}
                                />
                );
};

export default PickPersonality;
