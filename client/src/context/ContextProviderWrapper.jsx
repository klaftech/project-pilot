import UserContextProvider from "./UserContextProvider";
import ActiveProjectContextProvider from "./ActiveProjectContextProvider";
import ProjectsContextProvider from "./ProjectsContextProvider";
import UnitsContextProvider from "./UnitsContextProvider";
import TasksContextProvider from "./TasksContextProvider";

const ContextProviderWrapper = ({children}) => (
    <UserContextProvider>
        <ActiveProjectContextProvider>
            <ProjectsContextProvider>
                <UnitsContextProvider>
                    <TasksContextProvider>
                        {children}
                    </TasksContextProvider>
                </UnitsContextProvider>
            </ProjectsContextProvider>
        </ActiveProjectContextProvider>
    </UserContextProvider>
)
export default ContextProviderWrapper