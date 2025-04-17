import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getReadableStatus } from "@/utils/status_codes"
import { stringToDate, formatDateTimePretty } from "@/utils/date"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"

function UpdatesCardBubbles({updates}) {
    // const handleSendMessage = (data) => console.log(data)
    // const setNewMessage = (message) => "value"
    // const newMessage = "new message"
    
    if(updates && updates.length > 0){
        return (
            <div className="flex flex-col h-screen max-w-md mx-auto p-4">
                {/* <div className="flex items-center pb-4 border-b">
                    <Avatar className="h-10 w-10 mr-2">
                    <div className="bg-primary rounded-full w-full h-full flex items-center justify-center text-primary-foreground">
                        JD
                    </div>
                    </Avatar>
                    <div>
                    <h1 className="font-medium">John Doe</h1>
                    <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div> */}

                <ScrollArea className="flex-1 py-4">
                    <div className="space-y-4">
                        {updates.map((update) => (
                        <div key={update.id} className={`flex ${update.id === "user" ? "justify-end" : "justify-start"}`}>
                            <Avatar className="h-8 w-8 mr-2 mt-1">
                                <div className="bg-primary rounded-full w-full h-full flex items-center justify-center text-primary-foreground">
                                    {update.user.name}
                                </div>
                            </Avatar>
                            <div className="max-w-[80%]">
                                <Card 
                                    className={`p-3 ${
                                    update.id === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted rounded-tl-none"
                                }`}
                                >
                                    <p className="text-sm">Status: {getReadableStatus(update.task_status)}</p>
                                    <p className="text-sm">{update.message && "Message: "+update.message}</p>
                                </Card>
                                <p className="text-xs text-muted-foreground mt-1 px-1">{formatDateTimePretty(stringToDate(update.timestamp, true))}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t">
                    <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    />
                    <Button type="submit">Send</Button>
                </form> */}
            </div>
        )
    } else {
        return (
            <Card>
                <CardHeader>
                    <CardTitle></CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                    <div>No updates found</div>
                </CardContent>
                {/* <CardFooter>
                    <p>Card Footer</p>
                </CardFooter> */}
            </Card>                
        )
    }
}
export default UpdatesCardBubbles