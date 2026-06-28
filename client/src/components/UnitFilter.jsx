import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useContext } from 'react'
import UserContext from '@/context/UserContext'
import UnitsContext from '@/context/UnitsContext'
import { useUpdateUser } from '@/hooks/useUpdateUser'

const UnitFilter = () => {
    const updateUser = useUpdateUser()

    const {user, setUser} = useContext(UserContext);
    const {units, setUnits} = useContext(UnitsContext);

    const handleUnitChange = (unit_id) => {
        console.log("updating selectedUnit in profile to: "+unit_id)
    
        // save change to user profile in context
        updateUser({selectedUnit: unit_id})
    }
    
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">Unit:</label>
            <Select onValueChange={handleUnitChange} value={user.selectedUnit}>
                <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                    {units.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    )
}

export default UnitFilter;
