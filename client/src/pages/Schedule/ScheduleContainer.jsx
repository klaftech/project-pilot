import GanttChart from './gantt-chart/GanttChart'
import Navbar from '../../components/Navbar'

function ScheduleContainer({ tasks }) {
    
    // 1. structure tasks as required for gantt chart
    const scheduledTasks = tasks.map((task) => ({
        id: task.id,
        name: task.name,
        type: 'task', //task.id == "20" ? 'project' : 'task',
        start: task.start,
        end: task.end,
        progress: task.progress,
        //assignees: ["admin"],
        //dependencies: task.dependencies.map(task => task.id), //if sending task object
        dependencies: task.dependencies, //assuming receiving array of IDs
        project: task.group.name,
        //styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
        isDisabled: true,
        //fontSize: '100',
        //project: 'SAS',
        hideChilren: false,
        // displayOrder: task.id
    }));

    // 2. determine group names and start and end dates from all tasks
    const groups = {}
    tasks.forEach(task => {
        const get_group = groups[task.group.id] ?? 1
    
        let group_start
        if (get_group == false){
            group_start = task.start
        } else if(get_group['start'] < task.start){ //we want the earliest start date of all tasks
            group_start = get_group['start']
        } else {
            group_start = task.start
        }

        let group_end
        if (get_group == false){
            group_end = task.end
        } else if(get_group['end'] > task.end){ //we want the latest end date of all tasks
            group_end = get_group['end']
        } else {
            group_end = task.end
        }

        groups[task.group.id] = {
            "name": task.group.name,
            "start": group_start,
            "end": group_end,
        }
    })
    //const uniqueGroups = [...new Set(tasks.map(task => task.group.name))];

    // 3. convert groups into gantt chart task structure
    const preppedGroups = []
    for (const [group_id, values] of Object.entries(groups)) {
        const group = {
            id: parseInt(10000+group_id),
            name: values.name,
            type: 'project',
            start: values.start,
            end: values.end,
            progress: 0,
            isDisabled: true,
            hideChilren: false,
            displayOrder: parseInt(group_id),
        }  
        preppedGroups.push(group)
    }

    // 4. merge tasks and groups
    const joinedTasks = scheduledTasks.concat(preppedGroups);
    
    // 5. sort merged array by date, putting groups first, the rebuild array with displayOrder numbering
    const sortedTasks = joinedTasks.sort((a, b) => {
        if (a.start.getTime() !== b.start.getTime()) {
            return a.start.getTime() - b.start.getTime() //sort by start date
        }
        if(a.type !== b.type){
            return a.type.localeCompare(b.type) //sort type alphabetically (puts project before task)
        }
        return 0 //if all parameters are equal, maintain original order
        // return a.start.getTime() - b.start.getTime() || a.type - b.type
    }).map((element, index) => {
        const new_element = {...element}
        new_element['displayOrder'] = index+1
        return new_element
    })

    // console.log('formatted tasks: ',scheduledTasks)
    // console.log('groups: ',groups)
    // console.log('preppedGroups: ',preppedGroups)
    // console.log('joinedTasks: ',joinedTasks)
    // console.log('sortedTasks: ',sortedTasks)


    const handleSetTasks = (data) => {
        console.log("setTasks fired on ScheduleContainer. no action defined yet.")
    }
    
    return (
        <>
            {/* <Navbar /> */}
            <div className="container mx-auto p-6">
                {sortedTasks && sortedTasks.length > 0 && <GanttChart tasks={sortedTasks} setTasks={handleSetTasks} />}
                {!sortedTasks || sortedTasks.length <= 0 && <p>No tasks found for this project.</p>}
            </div>
        </>
    )
}

export default ScheduleContainer