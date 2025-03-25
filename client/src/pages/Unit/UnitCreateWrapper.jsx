import AppWrapper from '@/components/AppWrapper.jsx'
import UnitCreateCardForm from './UnitCreateCardForm'

function UnitCreateWrapper() {
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