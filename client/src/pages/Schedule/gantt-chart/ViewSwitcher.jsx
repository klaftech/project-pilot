import { ViewMode } from "gantt-task-react";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export const ViewSwitcher = ({ onViewModeChange, onViewListChange, isChecked, currentView }) => {
    const viewOptions = [
        {label: "Hour", view: ViewMode.Hour},
        {label: "Quarter of Day", view: ViewMode.QuarterDay},
        {label: "Half of Day", view: ViewMode.HalfDay},
        {label: "Day", view: ViewMode.Day},
        {label: "Week", view: ViewMode.Week},
        {label: "Month", view: ViewMode.Month},
        {label: "Year", view: ViewMode.Year},
        {label: "Quarter of Year", view: ViewMode.QuarterYear},        
    ]

    //console.log(currentView)
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                variant="outline"
                size="sm"
                className="ml-auto hidden h-8 flex" //className="ml-auto hidden h-8 lg:flex"
                >
                    <Settings2 />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuCheckboxItem
                    key="tasklist"
                    className="capitalize"
                    checked={isChecked}
                    onCheckedChange={(value) => onViewListChange(!isChecked)}
                >
                    Show Task List
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Toggle View Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {viewOptions.map(option => {
                    const handleChangeView = () => onViewModeChange(option.view)
                    return <DropdownMenuCheckboxItem
                        key={option.label}
                        className="capitalize"
                        checked={currentView == option.view}
                        onCheckedChange={(value) => handleChangeView()}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                })}

            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// import { ViewMode } from "gantt-task-react";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// //import "gantt-task-react/dist/index.css";

// export const ViewSwitcher2 = ({ onViewModeChange, onViewListChange, isChecked }) => {
//   return (
//     <div className="ViewContainer">
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.Hour)}>Hour</Button>
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.QuarterDay)}>Quarter of Day</Button>
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.HalfDay)}>Half of Day</Button>
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.Day)}>Day</Button>
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.Week)}>Week</Button>
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.Month)}>Month</Button>
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.Year)}>Year</Button>
//       <Button variant="outline" className="hover:text-slate-200 m-1" onClick={() => onViewModeChange(ViewMode.QuarterYear)}>Quarter Year</Button>

//       <div className="Switch">
//         <label className="Switch_Toggle">
//           <Checkbox
//             type="checkbox"
//             defaultChecked={isChecked}
//             onClick={() => onViewListChange(!isChecked)}
//           />
//           <span className="Slider" />
//         </label>
//         Show Task List
//       </div>

//     </div>
//   );
// };