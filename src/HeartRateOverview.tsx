//Import statements
import { ReactNode, useEffect, useState } from "react";
import Papa from "papaparse";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

//Specifies the data types of heart rate data
type HrRow = {
    heart_rate: number;
    timestamp_16: string;
    hour_timestamp: string;
};

//Specifies the data types of the heart rate variability data
type HrvRow = {
    value: number;
    hour_timestamp: string;
}

//Format for slicing time variables
const formatTime = (value: string) => value.slice(11, 16);

export const HeartRateOverview = () => {
    //
    const [hrData, setHrData] = useState<HrRow[]>([]);
    const [hrvData, setHrvData] = useState<HrvRow[]>([]);


    useEffect(() => {
        //Fetches the heart rate data
        fetch("/heart_rate_hourly.csv")
        .then((res) => res.text())
        .then((text) => {
            //Parses the text to a workable format for Typescript
            const result = Papa.parse<any>(text, { 
                header: true 
            });
            //Go through each row of data
            const rows: HrRow[] = result.data
                .map((r:any) => ({
                    //Transform heart_rate to integer, rest stays string
                    heart_rate: Number(r.heart_rate),
                    timestamp_16: r.timestamp_16,
                    hour_timestamp: r.hour_timestamp,
                }));
            //Saves the changed dataset
            setHrData(rows);
        })
        //Catch and display error if it occurs
        .catch((err) => console.error("CSV load error", err));
    
        //Fetches the heart rate variability data
        fetch("/hrv_hourly.csv")
        .then((res) => res.text())
        .then((text) => {
            //Parses the text to a workable format for Typescript
            const result = Papa.parse<any>(text, { 
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(), 
            });
            //Go through each row of data
            const rows: HrvRow[] = result.data
                .filter((r:any) => r.value && r.hour_timestamp)
                .map((r:any) => ({
                    //Transform hrv_value to integer, rest stays string
                    value: Number(r.value),
                    hour_timestamp: r.hour_timestamp,
                }));
            //Saves the changed dataset
            setHrvData(rows);
        })
        //Catch and display error if it occurs
        .catch((err) => console.error("CSV load error", err));
    }, []);

    return(
    <div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
        <h1 className="text-2xl font-bold mb-4">Heart Rate Overview</h1>
        <p className="text-gray-600"> This is where you can view your recent heart rate and heart rate variability.</p>
    
        {/*Displays the heart rate graph*/}
        <h1 className="text-xl font-bold mb-4 text-black text-center">Heart rate</h1> 
{/* need to center the title */}
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={hrData}
                margin={{
                top: 5,
                right: 0,
                left: 0,
                bottom: 5,
                }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour_timestamp"  tickFormatter={(value) => formatTime(value as string)} />
            <YAxis />
            <Tooltip labelFormatter={(value) => formatTime(value as string)} />
            <Legend />
            <Line name="Heart rate" type="monotone" dataKey="heart_rate" stroke="#8884d8" activeDot={{r:8}} />
            <RechartsDevtools />
            </LineChart>
        </ResponsiveContainer>

        {/*Displays the heart rate variability graph */}
        <h1 className="text-xl font-bold mb-4 text-black text-center">Heart rate variability</h1>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={hrvData}
                margin={{
                top: 5,
                right: 0,
                left: 0,
                bottom: 5,
                }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour_timestamp"  tickFormatter={(value) => formatTime(value as string)} />
            <YAxis />
            <Tooltip labelFormatter={(value) => formatTime(value as string)} />
            <Legend />
            <Line name="Heart Rate variability" type="monotone" dataKey="value" stroke="#8884d8" activeDot={{r:8}} />
            <RechartsDevtools />
            </LineChart>
        </ResponsiveContainer>
    </div>


);
}

//Export the mini-app so it can be used in Header.tsx
export default HeartRateOverview;