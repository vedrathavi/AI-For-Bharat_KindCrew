"use client";

import { useState } from "react";
import apiClient from "@/lib/apiClient";

export default function Home() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const { data } = await apiClient.get("/health");
      setResponse(data);
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      setResponse({
        error: "Failed to connect to backend",
        details: errorMessage,
        url: "http://localhost:5000/health",
        tip: "Make sure backend server is running: cd backend && npm run dev",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          AI-For-Bharat KindCrew
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Next.js + Express Full Stack App
        </p>

        <div className="space-y-4">
          <button
            onClick={testBackend}
            disabled={loading}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "Testing..." : "Test Backend Connection"}
          </button>

          {response && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Response:
              </h3>
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              Tech Stack:
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <strong>Frontend:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Next.js 16</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Axios</li>
                  <li>• Zustand</li>
                </ul>
              </div>
              <div>
                <strong>Backend:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Express.js</li>
                  <li>• ES6 Modules</li>
                  <li>• CORS</li>
                  <li>• Nodemon</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
