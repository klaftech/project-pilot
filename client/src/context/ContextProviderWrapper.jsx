import UserContextProvider from "./UserContextProvider";
import ProjectsContextProvider from "./ProjectsContextProvider";
import TasksContextProvider from "./TasksContextProvider";

const ContextProviderWrapper = ({children}) => (
    <UserContextProvider>
        <ProjectsContextProvider>
            <TasksContextProvider>
                {children}
            </TasksContextProvider>
        </ProjectsContextProvider>
    </UserContextProvider>
)
export default ContextProviderWrapper