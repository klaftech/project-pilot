import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import { useParams } from "react-router"
import { useEffect, useState } from 'react'

//import DetailsCard from "./DetailsCard.jsx"
import AppWrapper from '@/components/AppWrapper.jsx'
import LoadingWrapper from "@/components/LoadingWrapper.jsx"

function UnitDetailsById() {
    let params = useParams()
    const unitId = params.unitId

    const [unitObj, setUnitObj] = useState()
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState(false)
    
    useEffect(() => {
        fetchUnit()
    }, [])

    const fetchUnit = () => {
        console.log("fetching individual unit from backend")

        fetch('/api/units/'+unitId)
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    setUnitObj(data)
                    setIsLoaded(true)
                })
            } else {
                //console.log("unit not found")
                //throw new Error(res.status);
                setError("Unable to load the unit specified.")
            }
        })
    }
    console.log("UnitObj: ",unitObj)

    if(!isLoaded){
        return ( 
            <AppWrapper><LoadingWrapper /></AppWrapper>
        )
    }

    return (
        <AppWrapper>
            <div className="flex justify-center items-center">
                <Tabs defaultValue="details" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="update">Update</TabsTrigger>
                    {/* <TabsTrigger value="password">Password</TabsTrigger> */}
                </TabsList>
                {error && <p>Could not find the unit specified</p>}
                <TabsContent value="details">
                    Coming Soon
                    {/* {!error && taskObj && <DetailsCard unit={unitObj} />} */}
                </TabsContent>
                <TabsContent value="update">
                    Coming Soon
                    {/* {!error && taskObj && <DetailsCardDependencies tasks={tasks} taskObj={taskObj} pushUpdateTask={pushUpdateTask} reloadTasks={reloadTasks} />} */}
                </TabsContent>

                </Tabs>
            </div>
        </AppWrapper>
    )
}
export default UnitDetailsById