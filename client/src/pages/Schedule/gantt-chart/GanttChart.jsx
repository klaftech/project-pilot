import { useState } from "react";
import { useNavigate } from 'react-router'
import { Gantt, ViewMode } from "gantt-task-react";
import { ViewSwitcher } from "./ViewSwitcher";

import "gantt-task-react/dist/index.css";

const NAME_WIDTH = 190
const DATE_WIDTH = 82

const shortDate = (date) => date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })

// compact task list: wider names, short dates (the library default truncates both)
const TaskListHeader = ({ headerHeight }) => (
  <div className="flex border-b text-xs font-medium text-muted-foreground" style={{ height: headerHeight }}>
    <div className="flex items-end px-2 pb-2" style={{ width: NAME_WIDTH }}>Task</div>
    <div className="flex items-end px-2 pb-2" style={{ width: DATE_WIDTH }}>Start</div>
    <div className="flex items-end px-2 pb-2" style={{ width: DATE_WIDTH }}>Finish</div>
  </div>
)

const TaskListTable = ({ rowHeight, tasks, onExpanderClick }) => (
  <div className="text-xs">
    {tasks.map(task => (
      <div key={task.id} className="flex items-center border-b border-muted odd:bg-muted/30" style={{ height: rowHeight }}>
        <div className="truncate px-2" style={{ width: NAME_WIDTH }} title={task.name}>
          {task.type === 'project'
            ? <button type="button" className="font-semibold" onClick={() => onExpanderClick(task)}>{task.hideChildren ? '▸' : '▾'} {task.name}</button>
            : <span className="pl-3">{task.name}</span>}
        </div>
        <div className="px-2 tabular-nums" style={{ width: DATE_WIDTH }}>{shortDate(task.start)}</div>
        <div className="px-2 tabular-nums" style={{ width: DATE_WIDTH }}>{shortDate(task.end)}</div>
      </div>
    ))}
  </div>
)

const stateLabels = { completed: 'Completed', in_progress: 'In progress', projected: 'Projected' }

const TooltipContent = ({ task }) => (
  <div className="rounded-md border bg-white p-3 text-xs shadow-md">
    <p className="mb-1 font-semibold">{task.name}</p>
    {task.scheduleState && <p className="text-muted-foreground">{stateLabels[task.scheduleState]}</p>}
    <p>{task.scheduleState === 'completed' ? 'Actual' : 'Projected'}: {shortDate(task.start)} – {shortDate(task.end)}</p>
    {task.plannedStart && <p className="text-muted-foreground">Planned: {shortDate(task.plannedStart)} – {shortDate(task.plannedEnd)}</p>}
  </div>
)

const isSmallScreen = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

const GanttChart = ({ tasks, setTasks }) => {
  const navigate = useNavigate();
  const [view, setView] = useState(ViewMode.Month);
  // the task list takes most of a phone screen; start with it hidden there
  const [isChecked, setIsChecked] = useState(!isSmallScreen());

  // open on recent history plus what's ahead, not on the first task (often a year back)
  const [viewDate] = useState(() => new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));

  const columnWidths = { [ViewMode.Year]: 350, [ViewMode.Month]: 160, [ViewMode.Week]: 120 }
  const columnWidth = columnWidths[view] ?? 65

  const handleClick = (task) => {
    if (task.type == "task") {
      navigate('/task/' + task.id)
    }
  };

  const handleExpanderClick = (task) => {
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-green-500" />Completed (actual)</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-blue-500" />In progress</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-slate-400" />Projected</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-yellow-200" />Today</span>
        </div>
        <ViewSwitcher
          onViewModeChange={(viewMode) => setView(viewMode)}
          onViewListChange={setIsChecked}
          isChecked={isChecked}
          currentView={view}
        />
      </div>

      {/* the chart scrolls inside its own box instead of widening the page */}
      <div className="w-full min-w-0 overflow-x-auto rounded-md border bg-white">
        <Gantt
          tasks={tasks}
          viewMode={view}
          viewDate={viewDate}
          locale="en-US"
          todayColor="#f0f08080"
          onClick={handleClick}
          onDoubleClick={handleClick}
          onExpanderClick={handleExpanderClick}
          listCellWidth={isChecked ? `${NAME_WIDTH + 2 * DATE_WIDTH}px` : ""}
          columnWidth={columnWidth}
          TaskListHeader={TaskListHeader}
          TaskListTable={TaskListTable}
          TooltipContent={TooltipContent}
        />
      </div>
    </>
  );
};

export default GanttChart;
