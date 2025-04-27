import { isDate } from "@/utils/date"

export const status_options = [
    {
        code: 0,
        title: "Undefined",
        update_visibility: false,
    },
    {
        code: 1,
        title: "Started",
        update_visibility: true,
    },
    {
        code: 25,
        title: "25%",
        update_visibility: true,
    },
    {
        code: 50,
        title: "50%",
        update_visibility: true,
    },
    {
        code: 75,
        title: "75%",
        update_visibility: true,
    },
    {
        code: 100,
        title: "100%",
        update_visibility: false,
    },
    {
        code: 200,
        title: "Completed",
        update_visibility: true,
    },
    {
        code: 300,
        title: "Scheduled",
        update_visibility: false,
    },
    {
        code: 310,
        title: "Pending",
        update_visibility: false,
    },
    {
        code: 311,
        title: "In Progress",
        update_visibility: false,
    },
    {
        code: 500,
        title: "Stuck",
        update_visibility: true,
    }
]

export const getReadableStatus = (status_code) => {
    const res = status_options.find((status) => status.code === status_code)
    return res.title
}

export const getFilteredStatusOptions = (taskObj, status_options) => {
    return status_options.filter((status) => {
      if (!status.update_visibility) return false;
  
      // Dont show any options if task is completed
      if (taskObj.complete_status == true || isDate(taskObj.complete_date)) {
        return false;
      }
      
      // Filter out current status
      if (taskObj.progress === status.code) {
        return false;
      }

      // Filter out 1, 25 and 50 for tasks already at 75
      if (taskObj.progress == 75 && (status.code === 1 || status.code === 25 || status.code === 50)) {
        return false;
      }

      // Filter out 1, 25 for tasks already at 50
      if (taskObj.progress == 50 && (status.code === 1 || status.code === 25)) {
        return false;
      }
      
      // Filter out 25 and 75 for short tasks
      if (taskObj.days_length <=7 && (status.code === 25 || status.code === 75)) {
        return false;
      }

      // Filter out 25, 50, 75 and 100 for very short tasks
      if (taskObj.days_length <=3 && (status.code === 25 || status.code === 50 || status.code === 75 || status.code === 100)) {
        return false;
      }
  
      return true;
    });
}