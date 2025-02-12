import Navbar from './Navbar'

function HTTP404({endpoint}) {
    return (
        <>
            <Navbar />
            <div className="container mx-auto p-6">
                <div className="flex gap-6">
                    The requested page <b>{endpoint}</b> does not exist. This error will not resolve itself.
                </div>
            </div>
        </>
    )
}
export default HTTP404