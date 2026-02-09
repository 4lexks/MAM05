import ReactDOM from "react-dom/client";

import "./index.css";
import logoImage from './logo/logo-transparent.png'


const App = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-blue-100">
    <div className="flex gap-2">
      {/* Logo on the left */}
      <div className="w-20 h-20 rounded-lg overflow-hidden">
        <img src={logoImage} alt="CardiacCare logo" className="w-full h-full object-cover" />
      </div>
      
      {/* Text next to it */}
      <div>
        <h1 className="text-5xl font-bold text-gray-800 mb-1">CardiacCare</h1>
         <p className="text-gray-600 text-lg">Your heart's best friend</p> {/* need to change this!! might not be professional looking*/}
      </div>
    </div>
    
    <div className="col-span-2 md:col-span-6 p-6 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mt-6">
      <h2 className="text-gray-700 text-lg mt-6">Managing Cardiac Arrythmia</h2>
    </div>
  </div>

    
);

const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);

root.render(<App />);

{/* <div class="flex items-center gap-4 mt-6 p-6 bg-white border-2 border-blue-200 rounded-2xl shadow-sm">…</div>flex<div class="p-3 bg-blue-100 rounded-xl">…</div> */}