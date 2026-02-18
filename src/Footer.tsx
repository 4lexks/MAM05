import {ActiveApp} from "./Header"
import "./index.css";


type FooterApp = {
    activeApp: ActiveApp;
};

export const Footer = ({activeApp} : FooterApp) => {
    return(
        <div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mt-6 mx-4 md:mx-6 lg:mx-8 italic">
            <p>This project was made by Emma Karnbrock, Ronja Laurila, Isha Triloki and Aleksandra Čaluković for course MAM05. The code for this project can be found <a href="https://github.com/4lexks/MAM05" className="">here</a>.</p>
            <div>
                {activeApp === "habitTracker" && (
                    <div>The habit tracker uses the Hasura API to create, show and remove habit cards.</div>
                )}
                {activeApp === "medicineTracker" && (
                    <div>The medicine tracker uses the Hasure API to create, show and remove medication cards. The autofill function in the form to add a medication used the Dutch geneesmiddeleninformatiebank.</div>
                )}
                {activeApp === "heartRateMonitor" && (
                    <div>The data shown in the graphs was exported from a Garmin vivoactive 6 wearable, converted from fit-format to csv-format with Garmin's FitCSVTool, and synthesised using Python's synthetic data vault (SDV) library.</div>
                )}
            </div>
        </div>
    );
}