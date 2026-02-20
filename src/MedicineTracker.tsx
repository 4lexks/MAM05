//Import statements
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./index.css";

//represents a medication entry in the database
type Medicine = {
  medication_name: string;
  dose_amount: number;
  dose_unit: string;
  amount_per_day: number;
  time_to_take: string[];
};

//the URL of the Hasura GraphQL API
const hasuraGraphqlUrl = "https://elegant-kitten-75.hasura.app/v1/graphql";

async function graphqlFetch<TData>(
  query: string,
  variables?: Record<string, any>,
): Promise<TData> {
  const res = await fetch(hasuraGraphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret":
        "YE1f93reDnXFdRV31eAsxnu4i825TEWR9YdathnOtx63q480VtCLhab7gCfYNogh",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    console.error("Graphql errors:", json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

/**
 * regex to extract name, form, dose amount and unit from productnaam
 *  example: "Kruidvat Cetirizine diHCl 10 mg Allergietabletten, filmomhulde tabletten"
 * - name: Kruidvat Cetirizine diHCl
 * - dose amount: 10
 * - unit: mg
 * - form: Allergietabletten, filmomhulde tabletten
 * We assume the format is always: [name] [dose amount] [dose unit], [form]
 */
const PRODUCTNAAM_REGEX= /^(.+?)\s+(\d+)\s*(mg|g|mcg|µg|ml|IU)\b,?\s*(.+)$/;

/**
 * Parses the productnaam to extract medication name, dose amount, dose unit and form.
 * Returns null if the format is unexpected.
 */
function parseMedicationName(productnaam: string) {
  const match = productnaam.match(PRODUCTNAAM_REGEX);
  if (!match) return null;
  return{
    name: match[1].trim(),
    doseAmount: parseInt(match[2], 10),
    doseUnit: match[3],
    form: match[4].trim()
  }
}

/**
 * Returns a label for the time of day based on the hour in the time string.
 * - Morning: 5:00 - 11:59
 * - Afternoon: 12:00 - 16:59 ..etc
 * If the time format is unexpected, returns a default message.
 */
function getTimeLabel(time: string) {
  let hour: number;
  const simpleMatch = time.match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (simpleMatch) {
    hour = parseInt(simpleMatch[1], 10);
  } else {
    return"failed to parse time";
  }

  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 19) return "Evening";
  return "Night";
}

/**
 * Formats a time string to ensure it is in HH:mm format, removing seconds if present.
 * For cleaner display
 */
function formatTime(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (!match) return timeStr; // Return original if format is unexpected
  const hour = parseInt(match[1], 10);
  const minute = match[2];
  return `${hour}:${minute}`;
}

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * A modal popup that appears centered on screen with a dark overlay.
 * Uses createPortal to render outside the normal component tree,
 * so it always displays on top of everything else.
 */
function Portal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "350px",
        }}
      >
        {children}
        <button onClick={onClose} className="mt-3 text-gray-500 hover:text-gray-700">Close</button>
      </div>
    </div>,
    document.body,
  );
}

export const MedicineTracker = () => {
  //state variables
  const [medications, setMedications] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // Controls the "Add Medication" modal

  //form inputs for adding new medication
  const [medNameInput, setMedNameInput] = useState("");
  const [amountPerDayInput, setAmountPerDayInput] = useState("");
  const [timeInputs, setTimeInputs] = useState<string[]>([]); // dynamic array of time inputs based on amountPerDayInput
  const [suggestions, setSuggestions] = useState<any[]>([]); // autocomplete suggestions from medicine_db query
  const [selectedMedInfo, setSelectedMedInfo] = useState<{ farmaceutischevorm: string ; toedienningsweg: string} | null>(null);

  // extracted dose info from productnaam using regex
  const [extractDose, setExtractedDose] = useState<{doseAmount: number; doseUnit: string} | null>(null);

  // tracks medication intake checkboxes, key is `${medication_name}-${timeIndex}`--> boolean. 
  // We persist this in localStorage so it remains checked even after page refresh. 
  // This is a simple way to track if the user has taken their medication for each scheduled time.
  const [checkboxState, setCheckboxState] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("checkboxState");
    return saved ? JSON.parse(saved) : {};
  });

  // Whenever checkboxState changes, saves it to localStorage
  useEffect(() => {
    localStorage.setItem("checkboxState", JSON.stringify(checkboxState));
  }, [checkboxState]);

  const GET_MEDICATIONS = `
    query GetMedications {
      medication_table {
        medication_name
        dose_amount
        dose_unit
        amount_per_day
        time_to_take
      }
    }
  `;

  const INSERT_MEDICATION = `
    mutation InsertMedication(
      $medication_name: String!, 
      $dose_amount: Int!, 
      $dose_unit: String!, 
      $amount_per_day: Int!, 
      $time_to_take: [time!]) {
      insert_medication_table_one(object: {
        medication_name: $medication_name,
        dose_amount: $dose_amount,
        dose_unit: $dose_unit,
        amount_per_day: $amount_per_day,
        time_to_take: $time_to_take,
      }) {
        medication_name
        dose_amount
        dose_unit
        amount_per_day
        time_to_take
      }
    }
  `;

  const DELETE_MEDICATION = `
  mutation DeleteMedication($medication_name: String!) {
    delete_medication_table_by_pk(medication_name: $medication_name) {
      medication_name
    }
  }
  `;
  /**
   * Searches the Geneesmiddeleninformatiebank (medicine_db)
   * for medicines matching the user's input. Uses _ilike for
   * case-insensitive partial matching. Limited to 5 results for
   * the autocomplete dropdown.
   */
  const SEARCH_MEDICATION_DB = `
    query SearchMedication($search: String!) {
      medicine_db(where: {productnaam: { _ilike: $search }}
      limit: 5) {
        productnaam
        registratienummer
        farmaceutischevorm
        toedienningsweg
      }
    }
  `;

    // Loads all medications from the database and updates state 
  const loadMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlFetch<{ medication_table: Medicine[] }>(
        GET_MEDICATIONS,
      );
      console.log("Graphql medications data:", data);
      setMedications(
        Array.isArray(data.medication_table) ? data.medication_table : [],
      );
    } catch (e: any) {
      setError(e.message ?? "Failed to load medications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  /** 
  * search medication_db for suggestions based on user input. 
  * Only triggers if input length >= 3 to avoid excessive queries. 
  * Results are shown in autocomplete dropdown.
  */
  const searchMedication = async (search: string) => {
    if (search.length < 3) { 
      setSuggestions([]);
      return;
    }
    try {
      const data = await graphqlFetch<{ medicine_db: any[] }>(SEARCH_MEDICATION_DB, 
        { search: `%${search}%` });
      setSuggestions(data.medicine_db || []);
    }
    catch (e) {
      console.error("Failed to search medication:", e);
      setSuggestions([]);
    }
  }
  /** 
  * When the user changes the "amount per day" input, we update the timeInputs array to have the same number of entries.
  * This allows us to dynamically show the correct number of time input fields for the user to specify when they take their medication.
  * If the input is invalid (not a number between 1 and 10), we reset the timeInputs to an empty array.
  */
  const handleAmountPerDayChange = (value: string) => {
    setAmountPerDayInput(value);
    const amount = parseInt(value, 10);
    if (!isNaN(amount) && amount > 0 && amount <= 10) {
       //create empty time slots
      const timeSlots =  Array.from({ length: amount }, (_, i) => 
        timeInputs[i] || "",);
      setTimeInputs(timeSlots);
    } else {
      setTimeInputs([]);
    }
  };
  
  /** 
  * When the user checks or unchecks a medication intake checkbox, we update the checkboxState with a key that combines the medication name and time index.
  * key format ensures each medication + time slot combo is uniqye. The value is toggled between true and false.
  * This allows us to track which specific dose of which medication has been marked as taken.
  * Example: If "Metoprolol 50 mg" has 2 doses, the keys would be:
  *   "Metoprolol 50 mg-0" (first dose)
  *   "Metoprolol 50 mg-1" (second dose)
  * How the toggle works:
  *   - ...prev spreads (copies) all existing checkbox states into the new object
  *   - [key]: !prev[key] flips the value for just this specific dose
  *   - If prev[key] is undefined (first click), !undefined = true → checkbox becomes checked
  *   - If prev[key] is true, !true = false → checkbox becomes unchecked
  */
  const handleCheckboxChange = (medNameInput: string, timeIndex: number) => {
    const key = `${medNameInput}-${timeIndex}`;
    setCheckboxState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
  * update timpe input fields when user changes the time for a specific dose. 
  * We create a new array with the updated time value at the correct index, and set it to state. 
  * This ensures the correct times are saved when creating the medication entry.
  */
  const handleTimeChange = (index: number, value: string) => {
    const updated = [...timeInputs];
    updated[index] = value;
    setTimeInputs(updated);
  }

  /**
   * Submits the new medication to the database.
   * Validates that all required fields are filled before sending.
   * Appends ":00" to time strings since the HTML time input gives "HH:MM"
   * but Hasura expects "HH:MM:SS" format.
   * Resets the form and reloads the medication list on success.
   */
  const createMedication = async () => {
    // Basic validation to ensure all fields are filled
    if (!medNameInput|| !amountPerDayInput || !extractDose) return;
    const allTimeInputsFilled = timeInputs.length > 0 && timeInputs.every((t) => t !== "");
    if (!allTimeInputsFilled) return;

    // all time slots must be filled
    const amount_per_day = parseInt(amountPerDayInput, 10);

    // Convert time inputs to "HH:MM:SS" format expected by Hasura
    const time_to_take = timeInputs.map((t) => {
      return t.length === 5 ? `${t}:00` : t; // add seconds if not provided
    });

    try {
      await graphqlFetch<{ insert_medication_table: Medicine }>(
        INSERT_MEDICATION,
        {
          medication_name: medNameInput,
          dose_amount: extractDose.doseAmount,
          dose_unit: extractDose.doseUnit,
          amount_per_day,
          time_to_take: time_to_take, 
        },
      );
      // reset all fields after successful creation
      setMedNameInput("");
      setAmountPerDayInput("");
      setTimeInputs([]);
      setSuggestions([]);
      setSelectedMedInfo(null);
      setExtractedDose(null);
      setIsOpen(false);
      await loadMedications();
    } catch (e: any) {
      alert(e.message ?? "Failed to create medication");
    }
  };
    
  /** deletes a medication by name and refreshes the list.*/
  const deleteMedication = async (medication_name: string) => {
    setLoading(true);
    setError(null);
    try {
      await graphqlFetch
      <{ delete_medication_table_by_pk: {medication_name: string} | null;}>(DELETE_MEDICATION, {medication_name});
      await loadMedications();
    } catch (e: any) {
      setError(e.message ?? "Failed to delete medication");
    } finally {
      setLoading(false);
    }
  };

    /**
   * Handles selecting a medicine from the autocomplete dropdown.
   * - Sets the input field to the full product name
   * - Stores the pharmaceutical form & administration route for display
   * - Attempts to auto-extract the dosage via regex from the product name
   * - Clears the suggestion list
   */
  const handleSelectSuggestion = (med: any) => {
    setMedNameInput(med.productnaam);
    setSelectedMedInfo({
      farmaceutischevorm: med.farmaceutischevorm,
      toedienningsweg: med.toedienningsweg,
    });
    setSuggestions([]);

    // Try to extract dose from the product name using regex 
    const extracted = parseMedicationName(med.productnaam);
    if (extracted) {
      setExtractedDose({ doseAmount: extracted.doseAmount, doseUnit: extracted.doseUnit });
    } else {
      //regex failed to extract dose is set to null
      setExtractedDose(null);
    }
  };
   

  return (
    <><div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
        <div className="flex justify-between gap-4 items-center">
          <h1 className="text-2xl font-bold">Medication Tracker</h1>
          <div className="flex- gap-2">
            <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600">
              Add Medication
            </button>
          </div>
        </div>
      <p className="text-gray-600">
        This is where you can track your medications and manage your
        prescriptions.
      </p>
          
        <div className="flex flex-col mt-2 w-full">
          {/* medication list */}
          {loading && <p>Loading medications...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          <div className="space-y-4">
            {medications.map((medication) => (
              <div 
                key={medication.medication_name}
                className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm"
              >
                {/*header: medication name  + remove button */}
                <div className=" flex items-center w-full">
                  <p className="flex-1 text-xl font-semibold">
                    {medication.medication_name}
                  </p>
                  <button
                    onClick={() => deleteMedication(medication.medication_name)}
                    className="px-3 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>

                {/* dosage summary  extracted by regexp from productname*/}
                <p className="text-sm text-gray-500">
                  {medication.dose_amount} {medication.dose_unit} {medication.amount_per_day}x per day
                </p>
                
                {/* schedule: one row per time to take with checkbox */}
                <p className="text-lg font-medium"> Today&apos;s Schedule</p>
                <div className="flex flex-col gap-2">
                  {Array.isArray(medication.time_to_take) &&
                    medication.time_to_take.map((time, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 bg-white border-2 border-blue-200 rounded-xl shadow-sm"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {getTimeLabel(time)}
                          </p>
                          <p className="font-semibold">{formatTime(time)}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checkboxState[`${medication.medication_name}-${i}`] || false}
                          onChange={ () => handleCheckboxChange(medication.medication_name, i)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {!loading && medications.length === 0 && !error && (
              <p className="text-gray-500">No medications added yet. Click "Add Medication" to get started.</p>
            )}
          </div>
      </div>

      {/* Add Medication Modal */}
        <Portal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <h2 className="text-xl font-bold mb-4">Add new medication</h2>
          <div className="flex flex-col gap-3">
            {/* Medicine name input with autocomplete */}
            <label className="text-sm font-medium text-gray-700">
              Medicine name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Start typing a medicine name..."
                value={medNameInput}
                onChange={(e) => {
                  setMedNameInput(e.target.value);
                  searchMedication(e.target.value); //trigger autocomplete search on input
                  setSelectedMedInfo(null); // reset selected info on new input
                  setExtractedDose(null);
                }}
                className="border rounded px-3 py-2 w-full"
              />
              {/* autocomplete dropdown */}
              {suggestions.length > 0 && (
                <ul className="absolute bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto z-10 shadow-lg">
                  {suggestions.map((med, i) => (
                    <li
                      key={i}
                      onClick={() => handleSelectSuggestion(med)}
                      className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    >
                      <p className="font-medium">{med.productnaam}</p>
                      <p className="text-sm text-gray-500">
                        {med.farmaceutischevorm} — {med.toedienningsweg}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Show auto-extracted dose + medicine info */}
            {selectedMedInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm">
                <p>
                  <span className="font-semibold">Type: </span>
                  {selectedMedInfo.farmaceutischevorm}
                </p>
                <p>
                  <span className="font-semibold">Usage: </span>
                  {selectedMedInfo.toedienningsweg}
                </p>
                {extractDose && (
                  <p>
                    <span className="font-semibold">Dosage (auto): </span>
                    {extractDose.doseAmount} {extractDose.doseUnit}
                  </p>
                )}
              </div>
            )}

            {/*Frequency input: determines how many time slots to show * */}
            <label className="text-sm font-medium text-gray-700">
              How many times per day?
            </label>
            <input
              type="number"
              min="1"
              max="10"
              placeholder="e.g. 3"
              value={amountPerDayInput}
              onChange={(e) => handleAmountPerDayChange(e.target.value)}
              className="border rounded px-3 py-2"
            />

            {/* Dynamic time inputs, one per daily dose, generated based on frequency */}
            {timeInputs.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  What time for each dose?
                </label>
                {timeInputs.map((time, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-16">
                      Dose {i + 1}:
                    </span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(i, e.target.value)}
                      className="border rounded px-3 py-2 flex-1"
                    />
                    {time && (
                      <span className="text-xs text-gray-400">
                        {getTimeLabel(time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit button: disabled until all required fields are filled */}
            <button
              onClick={createMedication}
              disabled={
                !medNameInput ||
                !extractDose ||
                !amountPerDayInput ||
                timeInputs.some((t) => t === "")
              }
              className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </Portal>
      </div>
    </>
  );
};

export default MedicineTracker;

