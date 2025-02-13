import LoadingCard from './LoadingCard'

export default function LoadingWrapper() {
    return (
        <div className="flex justify-center items-center">
            <div className="w-[400px]">
                <div classname="py-20">
                    <LoadingCard />
                </div>    
            </div>
        </div>
    )
}