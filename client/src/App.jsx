
import ShadBtn from './ShadBtn'
import TableContainer from './data-table/PaymentTableContainer'
import ChartCard from './data-table/ChartCard'
import Header from './Header'

function App() {
  return (
    <>
      <Header />

      <div className="container mx-auto p-6">

        {/* 
        grid-cols-1: For very small screens (mobile phones), it will show one column.
        sm:grid-cols-2: For small screens, it will display two cards per row.
        md:grid-cols-3: For medium screens (tablets), it will display three cards per row.
        lg:grid-cols-4: For larger screens (laptops), it will display four cards per row.
        xl:grid-cols-5: For extra large screens (desktops), it will display five cards per row.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            <h3 className="text-xl font-semibold">Card Title 1</h3>
            <p className="text-gray-500 mt-2">This is a brief description of the card content.</p>
          </div>
          
          <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            <h3 className="text-xl font-semibold">Card Title 2</h3>
            <p className="text-gray-500 mt-2">This is a brief description of the card content.</p>
          </div>
          
          <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            <h3 className="text-xl font-semibold">Card Title 3</h3>
            <p className="text-gray-500 mt-2">This is a brief description of the card content.</p>
          </div>
          
          <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            <h3 className="text-xl font-semibold">Card Title 4</h3>
            <p className="text-gray-500 mt-2">This is a brief description of the card content.</p>
          </div>
        </div>
      </div>
      
      {/* <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl"></div> */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <ChartCard />
        </div>
      </div>
      
      <div className="container mx-auto p-6">
          <div className="mx-auto">
          {/* <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl"> */}
          <TableContainer />
        </div>
      </div>
    </>
  )
}

export default App
