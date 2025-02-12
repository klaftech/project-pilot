import {
    //ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
  } from "@/components/ui/chart"
  
  import { PieChart, Pie, Sector, Cell, ResponsiveContainer, RadialBarChart, PolarAngleAxis, RadialBar } from 'recharts';

  
// https://stackoverflow.com/questions/53845317/implement-circular-progress-bar-using-recharts
export default function ProgressBar({progress}) {

    const chartConfig = {
        desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
        },
        mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))",
        },
    }

    // RadialBarChart
    const dataRadialBarChart = [
        { name: 'L1', value: 25 }
    ];
    const circleSize = 30;

    // PieChart
    const dataPieChart = [
        { id: "1", name: "L1", value: 75 },
        { id: "2", name: "L2", value: 25 }
    ];


    const data = [
        { id: "1", name: "L1", value: progress },
        { id: "2", name: "L2", value: 100-progress }
    ];
    //console.log(data)

    return (
      <>
        {/* Important: Remember to set a min-h-[VALUE] on the ChartContainer component. This is required for the chart be responsive. */}
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            
            <PieChart width={50} height={50}>
                <text
                    x={"50%"} //25
                    y={"50%"} //25
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {progress}%
                </text>
                <Pie
                    data={data}
                    dataKey="value"
                    innerRadius="80%"
                    outerRadius="100%"
                    fill="#CCC" //grey
                    startAngle={90} //90
                    endAngle={-270} //-270
                    paddingAngle={0}
                    blendStroke
                >
                    <Cell
                        key="Progress"
                        fill="#82ca9d" //green
                    />
                </Pie>
            </PieChart>
            
            {/* 
            <RadialBarChart
                width={circleSize}
                height={circleSize}
                cx={circleSize / 2} //markout to center
                cy={circleSize / 2} //markout to center
                innerRadius={12} //"80%" 
                outerRadius={18} //"100%"
                barSize={2}
                data={dataRadialBarChart}
                startAngle={90}
                endAngle={-270}
            >

                <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                />
                
                <RadialBar
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={circleSize / 2}
                    fill="#82ca9d"
                />
                
                <text
                    x={circleSize / 2}
                    y={circleSize / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="progress-label"
                >
                25
                </text>
                
            </RadialBarChart> 
            */}

        </ChartContainer>
    </> 
  )
}