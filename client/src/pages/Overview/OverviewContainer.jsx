import { formatDatePretty, isDate } from '@/utils/date.js'
import AppWrapper from '@/components/AppWrapper.jsx'
import OverviewTable from './OverviewTable.jsx'

//import OverviewSimpleTable from './_OverviewSimpleTable.jsx'
import DataTable from 'react-data-table-component';
import StatusBadge from '@/components/StatusBadge.jsx'

// TODO: option to toggle (or timer that toggle every 20s..) between project & weekly stats 
const OverviewContainer = () => {
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
    <AppWrapper>
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
    </AppWrapper>
  )
}
export default OverviewContainer