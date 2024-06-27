import { getAssistantAvatar, getUserAvatar } from "@/lib/utils";
import { MoonStar, MoonStarIcon } from "lucide-react";
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
                    <div className="flex flex-col max-h-[300px] gap-2 mb-4 rounded-2xl transition-colors duration-200 ease-in-out">
                        <div className="flex flex-row items-center">
                            <div className="w-3/5 max-w-[300px] transition-transform duration-300 ease-in-out scale-90 hover:scale-100">
                                <Image
                                    src={getAssistantAvatar(
                                        selectedToy.image_src!
                                    )}
                                    width={300}
                                    height={300}
                                    alt={selectedToy.name}
                                    className="w-full h-auto" // Make image responsive within container
                                />
                            </div>
                            <MoonStar
                                fill="#4b5563"
                                className="text-gray-600"
                            />
                            <div className="w-2/5 max-w-[140px] transition-transform duration-300 ease-in-out scale-90 hover:scale-100">
                                <Image
                                    src={getUserAvatar(user.email)}
                                    width={140}
                                    height={140}
                                    alt={user.child_name}
                                    className="w-full h-auto" // Make image responsive within container
                                />
                            </div>
                        </div>
                    </div>
                    {children}
                    {/* <App /> */}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ChildPlayground;
