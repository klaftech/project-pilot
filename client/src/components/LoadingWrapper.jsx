import LoadingCard from './LoadingCard'

export default function LoadingWrapper() {
    return (
        <div className="flex justify-center items-center">
            <div className="w-[400px]">
                {/* <div className="py-20"> */}
                    <LoadingCard />
                {/* </div>     */}
            </div>
        </div>
    )
}