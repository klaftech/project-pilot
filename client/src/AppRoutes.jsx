import { Routes, Route } from "react-router";
import ScheduleContainer from "./ScheduleContainer";
import ListContainer from './ListContainer'

import App from './App'
import ComingSoon from './ComingSoon'
import ShadBtn from './ShadBtn'

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="tasks" element={<ComingSoon endpoint="tasks" />} />
            <Route path="list" element={<ListContainer />} />
            <Route path="schedule" element={<ScheduleContainer />} />
            <Route path="gr" element={<ShadBtn />} />
            <Route path="*" element={<ComingSoon endpoint="404" />} />
        </Routes>
    )
}

export default AppRoutes