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
        <div className="max-w-md mx-auto p-1">
            <div>
            <label className="block text-sm font-medium mb-2">Select a Unit:</label>
            
            <Select onValueChange={handleUnitChange} value={user.selectedUnit}>
                <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                {units.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>

            {user.selectedUnit && (
            <div className="text-sm text-muted-foreground">
                Showing Unit ID: <span className="font-medium">{user.selectedUnit}</span>
            </div>
            )}
        </div>
    )
}

export default UnitFilter;
