function CSS() {
    // https://stackoverflow.com/questions/67582206/problem-with-overflow-in-tailwindcss-layout

    return (


<div class="w-screen bg-black flex flex-col">
  <div class="bg-green-200">NAVBAR WORKING</div>
  <div class="bg-black flex flex-col h-full overflow-y-auto">
    {/* <!-- THREE COLUMNS LAYOUT --> */}
    <div class="flex h-full">
      
      {/* <!-- COLUMN ONE --> */}
      <div class="flex-1 flex flex-col bg-white">
        
        <div class="flex flex-col bg-red-500 h-full">
          
          <div class="bg-white h-full flex-grow-0 overflow-y-auto">
            <div class="flex flex-col">
              <div class="h-48 bg-black"></div>
              <div class="h-48 bg-red-700"></div>
              <div class="h-48 bg-black"></div>
              <div class="h-48 bg-red-700"></div>
              <div class="h-48 bg-black"></div>
              <div class="h-48 bg-red-700"></div>
              <div class="h-48 bg-black"></div>
              <div class="h-48 bg-red-700"></div>
            </div>
          </div>
          
          <div class="bg-red-200 h-32 flex-none">
            This will always be fixed height
          </div>
          
          <div class="bg-red-300 h-20 flex-none">
            This will always be fixed height
          </div>
          
        </div>
        
      </div>
      {/* <!-- COLUMN ONE --> */}
      
      {/* <!-- COLUMN TWO --> */}
      <div class="flex-1 bg-yellow-300">MIDDLE</div>
      {/* <!-- COLUMN TWO --> */}
      
    </div>
    {/* <!-- THREE COLUMNS LAYOUT --> */}
  </div>
  <div class="bg-green-200">
    The Footer should always be visible
  </div>
</div>

    )
}

export default CSS