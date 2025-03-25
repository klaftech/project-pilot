import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

function DetailsCardAncestors({ancestors}) {
    if(ancestors && ancestors.length > 0){
        const displayDeps = ancestors.map(parent => {
            return <p key={parent.id}>• {parent.name}</p>
        })
        
        return (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle>Current Parent Tasks</CardTitle>
                        {/* <CardDescription>Card Description</CardDescription> */}
                    </CardHeader>
                    <CardContent>
                        {displayDeps}
                    </CardContent>
                    {/* <CardFooter>
                        <p>Card Footer</p>
                    </CardFooter> */}
                </Card>
            </>
        )
    } else {
        return (<div></div>)
    }
}
export default DetailsCardAncestors