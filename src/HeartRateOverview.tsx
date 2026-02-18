import { ReactNode, useEffect, useState } from "react";
import Papa from "papaparse";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

type HrRow = {
    heart_rate: number;
    timestamp_16: string;
    hour_timestamp: string;
};

type HrvRow = {
    hrv_value: number;
    timestamp_16: string;
    hour_timestamp: string;
}

const formatTime = (value: string) => value.slice(11, 16);

export const HeartRateOverview = () => {
    const [hrData, setHrData] = useState<HrRow[]>([]);
    const [hrvData, setHrvData] = useState<HrvRow[]>([]);

    useEffect(() => {
        fetch("/heart_rate_hourly.csv")
        .then((res) => res.text())
        .then((text) => {
            console.log("RAW TEXT (first 300 chars):", text);
            const result = Papa.parse<any>(text, { 
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(), 
            });
            console.log("Raw first row:", result.data[0]);
            console.log("Raw keys:", Object.keys(result.data[0] || {}));

            const rows: HrRow[] = result.data
                .filter((r:any) => r.heart_rate && r.hour_timestamp)
                .map((r:any) => ({
                    heart_rate: Number(r.heart_rate),
                    timestamp_16: r.timestamp_16,
                    hour_timestamp: r.hour_timestamp,
                }));

            console.log("Parsed CSV:", rows);
            console.log("Total rows:", rows.length);
            setHrData(rows);
        })
        .catch((err) => console.error("CSV load error", err));
    
        fetch("/heart_rate_variability_hourly.csv")
        .then((res) => res.text())
        .then((text) => {
            console.log("RAW TEXT (first 300 chars):", text);
            const result = Papa.parse<any>(text, { 
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(), 
            });
            console.log("Raw first row:", result.data[0]);
            console.log("Raw keys:", Object.keys(result.data[0] || {}));

            const rows: HrvRow[] = result.data
                .filter((r:any) => r.hrv_value && r.hour_timestamp)
                .map((r:any) => ({
                    hrv_value: Number(r.hrv_value),
                    timestamp_16: r.timestamp_16,
                    hour_timestamp: r.hour_timestamp,
                }));

            console.log("Parsed CSV:", rows);
            console.log("Total rows:", rows.length);
            setHrvData(rows);
        })
        .catch((err) => console.error("CSV load error", err));
    }, []);

    return(
    <div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
        <h1 className="text-2xl font-bold mb-4">Heart Rate Overview</h1>
        <p className="text-gray-600"> This is where you can view your recent heart rate and heart rate variability.</p>
    
    
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
            <Line type="monotone" dataKey="heart_rate" stroke="#8884d8" activeDot={{r:8}} />
            <RechartsDevtools />
            </LineChart>
        </ResponsiveContainer>

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
            <Line type="monotone" dataKey="hrv_value" stroke="#8884d8" activeDot={{r:8}} />
            <RechartsDevtools />
            </LineChart>
        </ResponsiveContainer>
    

        
    </div>


);
}

export default HeartRateOverview;