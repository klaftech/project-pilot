import React from "react";
import "gantt-task-react/dist/index.css";
import { ViewMode } from "gantt-task-react";

export const ViewSwitcher = ({ onViewModeChange, onViewListChange, isChecked, isDefaultData, onDataSourceChange }) => {
  return (
    <div className="ViewContainer">
      <button
        className="Button"
        onClick={() => onViewModeChange(ViewMode.Hour)}
      >
        Hour
      </button>
      <button
        className="Button"
        onClick={() => onViewModeChange(ViewMode.QuarterDay)}
      >
        Quarter of Day
      </button>
      <button
        className="Button"
        onClick={() => onViewModeChange(ViewMode.HalfDay)}
      >
        Half of Day
      </button>
      <button className="Button" onClick={() => onViewModeChange(ViewMode.Day)}>
        Day
      </button>
      <button
        className="Button"
        onClick={() => onViewModeChange(ViewMode.Week)}
      >
        Week
      </button>
      <button
        className="Button"
        onClick={() => onViewModeChange(ViewMode.Month)}
      >
        Month
      </button>
      <button
        className="Button"
        onClick={() => onViewModeChange(ViewMode.Year)}
      >
        Year
      </button>
      <button
        className="Button"
        onClick={() => onViewModeChange(ViewMode.QuarterYear)}
      >
        Quarter Year
      </button>
      <div className="Switch">
        <label className="Switch_Toggle">
          <input
            type="checkbox"
            defaultChecked={isChecked}
            onClick={() => onViewListChange(!isChecked)}
          />
          <span className="Slider" />
        </label>
        Show Task List
      </div>
      <div className="Switch">
        <label className="Switch_Toggle">
          <input
            type="checkbox"
            defaultChecked={isDefaultData}
            onClick={() => onDataSourceChange(!isDefaultData)}
          />
          <span className="Slider" />
        </label>
        Show Default Data
      </div>
    </div>
  );
};
