import ReactDOM from "react-dom/client";
import { useState } from "react"; 

export const HabitTracker = () => {
    return <div>
    <h1 className="text-2xl font-bold mb-4">Habit Tracker</h1>
    <p className="text-gray-600">This is where you can track manage your habits.</p>
  </div>;
}
const habit_tracker = ReactDOM.createRoot(document.getElementById("habit") as HTMLElement);

habit_tracker.render(<HabitTracker />);

