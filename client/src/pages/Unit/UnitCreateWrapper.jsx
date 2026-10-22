import { useContext } from 'react'
import AppWrapper from '@/components/AppWrapper.jsx'
import ShowAlert from '@/components/ShowAlert'
import UserContext from '@/context/UserContext'
import UnitCreateCardForm from './UnitCreateCardForm'

function UnitCreateWrapper() {
    const { user } = useContext(UserContext)
    if (!user?.is_admin) {
        return <AppWrapper><ShowAlert message="Only administrators can create units." /></AppWrapper>
    }
    return (
        <AppWrapper>
            <div className="flex justify-center items-center">
                <div className="w-[400px]">
                    <UnitCreateCardForm />
                </div>
            </div>
        </AppWrapper>
    )
}
export default UnitCreateWrapper