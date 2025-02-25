import CharacterSection from "./CharacterSection";

interface UserPersonalitiesProps {
        onPersonalityPicked: (personalityIdPicked: string) => void;
        allPersonalities: IPersonality[];
        personalityIdState: string;
        startCall: (personalityIdSelected: string) => void;
        languageState: LanguageCodeType;
        disableButtons: boolean;
}

const UserPersonalities: React.FC<UserPersonalitiesProps> = ({
        onPersonalityPicked,
        allPersonalities,
        personalityIdState,
        startCall,
        languageState,
        disableButtons,
}) => {
        return (
                <CharacterSection
                        allPersonalities={allPersonalities}
                        languageState={languageState}
                        personalityIdState={personalityIdState}
                        onPersonalityPicked={onPersonalityPicked}
                        startCall={startCall}
                        title={"Characters"}
                        disableButtons={disableButtons}
                />
        );
};

export default UserPersonalities;
