import { formatDatePretty, isDate } from './helpers.js'
import Navbar from './Navbar.jsx'
import OverviewTable from './OverviewTable'

import OverviewSimpleTable from './OverviewSimpleTable'
import DataTable from 'react-data-table-component';
import StatusBadge from './StatusBadge'

// TODO: option to toggle (or timer that toggle every 20s..) between project & weekly stats 
const OverviewContainer = ({ tasks }) => {
  /*
  const columns = [
    {
      name: 'Task',
      selector: row => row.name,
    },
    {
      name: 'Scheduled Start',
      selector: row => isDate(row.start) ? formatDatePretty(row.start) : "invalid date",
    },
    {
      name: 'Scheduled End',
      selector: row => isDate(row.end) ? formatDatePretty(row.end) : "invalid date",
    },
    {
      name: 'Status',
      selector: row => row.complete_status ? "Completed" : "Scheduled",
    },
    {
      name: 'Status',
      selector: row => <StatusBadge task={row} />,
    },
  ];
  */

  return (
    <>
      <Navbar />
      <OverviewTable />
      {/* 
      <OverviewSimpleTable />
      */}

      {/* 
      <section className="py-32">
        <div className="container px-0 md:px-8"> 
      */}
      
          {/* 
          <DataTable
            columns={columns}
            data={tasks}
          /> 
          */}

        {/* 
        </div>
      </section>
      */}
    </>
  )
}
export default OverviewContainer