import React from "react";
import {useState, ReactNode, useEffect} from "react";
import "./index.css";
import { createPortal } from 'react-dom';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

function Portal({ isOpen, onClose, children }:ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px'
      }}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}

type Habit = {
  id: number;
  habit_title: string;
  goal: number;
};
const hasuraGraphqlUrl = "https://elegant-kitten-75.hasura.app/v1/graphql";

async function graphqlFetch<TData>(
  query: string,
  variables?: Record<string, any>
): Promise<TData> {
  const res = await fetch(hasuraGraphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": "YE1f93reDnXFdRV31eAsxnu4i825TEWR9YdathnOtx63q480VtCLhab7gCfYNogh"
    },
    body: JSON.stringify({query, variables}),
  });

  const json = await res.json();

  if(json.errors) {
    console.error("Graphql errors:", json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

const HabitTracker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GET_HABITS = `
    query GetHabits {
      habit_table {
        id
        habit_title
        goal
      }
    }
  `;

  const INSERT_HABIT = `
    mutation InsertHabit($habit_title: String!, $goal: Int!) {
      insert_habit_table(object: {
        habit_title: $habit_title,
        goal: $goal
      }) {
        id
        habit_title
        goal
      }
    }
  `;

  {/*Load habits */}
  const loadHabits = async () => {
    setLoading(true);
    setError(null);
    try{
      const data = await graphqlFetch<{habit_table:Habit[]}>(GET_HABITS);
      console.log("Graphql habits data:", data);
      setHabits(Array.isArray(data.habit_table) ? data.habit_table : []);
  } catch (e:any) {
    setError(e.message ?? "Failed to load habits");
  } finally {
    setLoading(false);
  }
  }; 
  
  useEffect(() => {
    loadHabits();
  }, []);

  const createHabit = async () => {
    const habit_title = prompt("Enter habit title");
    const goalInput = prompt("Enter habit goal");
    if (!habit_title || !goalInput) return;

    const goal = parseInt(goalInput, 10);
    if (Number.isNaN(goal)) {
      alert("Goal must be a number");
    return;
  }
    try {
      await graphqlFetch<{insert_habit_table: Habit}>(INSERT_HABIT, {habit_title, goal});
      await loadHabits();
    } catch (e: any) {
      alert(e.message ?? "Failed to create habit");
    }
  };

  return ( 
    <div className="flex gap-4 items-center p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
      <h1 className="text-2xl font-bold mb-4">Habit Tracker</h1>
      <p className="text-gray-600">This is where you can track manage your habits.</p>

      <p>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <Portal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2>Modal Content</h2>
        <p>This content is rendered outside the App component!</p>
      </Portal>
      </p>
      
      <button
          onClick={createHabit}
          className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
      >
        Add Habit
      </button>
      {loading && <p>Loading habits...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {/* LIST OF HABITS FROM DB */}
      <ul className="list-disc pl-5 space-y-1">
        {habits.map((habit) => (
          <li key={habit.id}>
            <span className="font-semibold">{habit.habit_title}</span>{" "}
            <span className="text-gray-600">– {habit.goal}</span>
          </li>
        ))}
        {!loading && habits.length === 0 && !error && (
          <li className="text-gray-500">No habits yet.</li>
        )}
      </ul>

    </div>

    

  );
}

export default HabitTracker;

