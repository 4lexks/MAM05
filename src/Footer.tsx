//Import statements
import {ActiveApp} from "./Header"
import "./index.css";

//Listens to the active page from the Header
type FooterApp = {
    activeApp: ActiveApp;
};

export const Footer = ({activeApp} : FooterApp) => {
    return(
        //creates a block to show footer text
        <div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mt-6 mx-4 md:mx-6 lg:mx-8 text-gray-600">
            <p>This project was made by Emma Karnbrock, Ronja Laurila, Isha Triloki and Aleksandra Čaluković for course MAM05. The code for this project can be found <a href="https://github.com/4lexks/MAM05" target="_blank" className="font-bold text-blue-500 hover:text-blue-700">here</a>.</p>
            {/*Shows Different text based on the active page*/}
                {activeApp === "habitTracker" && (
                    <div>The habit tracker uses the Hasura API to create, show and remove habit cards. Local Storage is used to remember the state of the checkboxes.</div>
                )}
                {activeApp === "medicineTracker" && (
                    <div>The medicine tracker uses the Hasure API to create, show and remove medication cards. The autofill function in the form to add a medication used the Dutch geneesmiddeleninformatiebank. Local Storage is used to remember the state of the checkboxes.</div>
                )}
                {activeApp === "heartRateMonitor" && (
                    <div>The data shown in the graphs was exported from a Garmin vivoactive 6 smartwatch. Python was used to manipulate the data, synthesise it using the library Synthetic Data Vault, and convert it to .csv-format.</div>
                )}
        </div>
    );
};

//Export the footer so it can be used in Header.tsx
export default Footer;