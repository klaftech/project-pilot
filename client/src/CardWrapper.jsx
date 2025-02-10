

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

//const cardFooter1 = (<div>Trending up by 5.2% this month <TrendingUp className="h-4 w-4" /></div>)
//const cardFooter2 = (<div>January - June 2024</div>)

export default function CardWrapper({ title, description, footer1, footer2, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
                {footer1}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
                {footer2}
            </div>
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}