import AppWrapper from '@/components/AppWrapper'

function HTTP404({endpoint}) {
    return (
        <AppWrapper>
            <div className="container mx-auto p-6">
                <div className="flex gap-6">
                    The requested page <b>{endpoint}</b> does not exist. This error will not resolve itself.
                </div>
            </div>
        </AppWrapper>
    )
}
export default HTTP404