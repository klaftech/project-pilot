import Navbar from './Navbar'

function ComingSoon({endpoint}) {
    return (
        <>
            <Navbar />
            <div className="container mx-auto p-6">
                <div className="flex gap-6">
                    The requested page <b>/{endpoint}</b> has not been created yet.
                </div>
            </div>
        </>
    )
}
export default ComingSoon