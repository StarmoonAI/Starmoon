// "use client";

// import { useState } from "react";
// import ChildPlayground from "./ChildPlayground";
// import ParentDashboard from "./ParentDashboard";

// const Dashboard = () => {
//     const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
//     const chooseUser = (user: IUser) => {
//         setSelectedUser(user);
//     };
//     return (
//         <>
//             <div className="flex flex-col gap-2 sm:w-1/2 border border-black rounded-md">
//                 <ParentDashboard
//                     chooseUser={chooseUser}
//                     selectedUser={selectedUser}
//                 />
//             </div>
//             <div className="flex flex-col gap-2 sm:w-1/2 border border-black rounded-md">
//                 <ChildPlayground selectedUser={selectedUser} />
//             </div>
//         </>
//     );
// };

// export default Dashboard;
