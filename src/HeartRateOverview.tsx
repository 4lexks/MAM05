import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import React from "react";

export const HeartRateOverview = () => {

    return(
    <div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
        <h1 className="text-2xl font-bold mb-4">Heart Rate Overview</h1>
        <p className="text-gray-600"> This is where you can view your recent heart rate and heart rate variability.</p>
    </div>
);
};

export default HeartRateOverview;