import Image from "next/image";

const IMAGE_SIZE = 200;

const ChildPlayground: React.FC<{
    selectedUser: IUser;
    selectedToy: IToy | null;
    children: React.ReactNode;
}> = ({ selectedUser, children, selectedToy }) => {
    const user = selectedUser;
    return (
        <div className="p-4 overflow-y-scroll w-full">
            {/* <p>Child playground</p> */}
            {user && selectedToy && (
                <div className="items-center flex flex-col w-full">
                    {selectedUser?.child_name ? (
                        <p className="text-lg">
                            <span className="font-bold">
                                {selectedToy?.name}
                            </span>{" "}
                            talking to{" "}
                            <span className="font-bold">
                                {selectedUser?.child_name}
                            </span>
                        </p>
                    ) : (
                        <p className="text-lg">
                            Talking to{" "}
                            <span className="font-bold">
                                {selectedToy?.name}
                            </span>
                        </p>
                    )}
                    <div
                        className={`flex flex-col max-w-[300px] max-h-[300px] gap-2 mb-4 rounded-2xl overflow-hidden transition-colors duration-200 ease-in-out`}
                    >
                        <Image
                            src={"/" + selectedToy.image_src! + "_avatar.png"}
                            width={250}
                            height={200}
                            alt={selectedToy.name}
                            className="transition-transform duration-300 ease-in-out scale-90 transform hover:scale-100"
                        />
                    </div>
                    {children}
                    {/* <App /> */}
                </div>
            )}
        </div>
    );
};

export default ChildPlayground;
