import { useState } from 'react'
import UnitsContext from './UnitsContext'

export default function UnitsContextProvider({ children }) {
    const [units, setUnits] = useState([]);
    return (
        <UnitsContext.Provider value={{units, setUnits}}>
            {children}
        </UnitsContext.Provider>
    )
}