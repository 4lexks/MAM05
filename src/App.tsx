//Import statements
import ReactDOM from "react-dom/client";
import Header from "./Header";
import "./index.css";

//Displays the header
const App = () => {
  return <Header />;
};

//Creates the connection to index.html by id=app
const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);

//Renders the application
root.render(<App />);
