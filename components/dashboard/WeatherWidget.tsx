"use client";

import { useState, useEffect } from "react";
import { getFarmWeather, getWeatherHistory, WeatherRecord } from "@/app/dashboard/weather/actions";
import { Farm } from "@/components/dashboard/FarmCard";
import { WeatherData, DailyForecastItem } from "@/src/lib/weather";
import Link from "next/link";
import WeatherHistory from "./WeatherHistory";

interface WeatherWidgetProps {
  farms: Farm[];
}

export default function WeatherWidget({ farms }: WeatherWidgetProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || "");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<DailyForecastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<WeatherRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!selectedFarmId) {
        setHistory([]);
        return;
      }
      setHistoryLoading(true);
      try {
        const result = await getWeatherHistory(selectedFarmId);
        if (result.data) {
          setHistory(result.data);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error("Failed to load history");
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [selectedFarmId]);

  if (farms.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No farms added yet.</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">You need to add a farm to view its local weather forecast.</p>
        <Link
          href="/dashboard/farm"
          className="px-6 py-2.5 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors inline-flex items-center"
        >
          Add Your Farm
        </Link>
      </div>
    );
  }

  const selectedFarm = farms.find((f) => f.id === selectedFarmId);
  const isGpsMissing = !selectedFarm?.latitude || !selectedFarm?.longitude;

  const handleFetchWeather = async () => {
    if (!selectedFarmId) return;
    
    setLoading(true);
    setError(null);
    setWeather(null);
    setForecast([]);
    setSaveMessage(null);

    try {
      const result = await getFarmWeather(selectedFarmId);
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setWeather(result.data);
        if (result.forecast) {
          setForecast(result.forecast);
        }
        if (result.saveMessage) {
          setSaveMessage(result.saveMessage);
          const historyResult = await getWeatherHistory(selectedFarmId);
          if (historyResult.data) {
            setHistory(historyResult.data);
          }
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred while fetching weather.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label htmlFor="farm-selector" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            My Farms
          </label>
          <select
            id="farm-selector"
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setWeather(null);
              setForecast([]);
              setError(null);
              setSaveMessage(null);
            }}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-colors"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.farm_name} {farm.location ? `(${farm.location})` : ""}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <button
            onClick={handleFetchWeather}
            disabled={loading || isGpsMissing}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Fetching weather...
              </>
            ) : (
              "Get Weather & 7-Day Forecast"
            )}
          </button>
        </div>
      </div>

      {/* GPS Missing State */}
      {isGpsMissing && !error && !weather && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-6 flex flex-col items-center text-center">
          <div className="text-3xl mb-3">📍</div>
          <h3 className="text-lg font-bold text-amber-800 dark:text-amber-500 mb-2">GPS location required</h3>
          <p className="text-amber-700 dark:text-amber-600 text-sm mb-4 max-w-md">
            We need your farm's exact coordinates to fetch accurate weather data and 7-day future forecasts. Please update your farm details.
          </p>
          <Link
            href="/dashboard/farm"
            className="px-5 py-2 rounded-lg bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Update Farm
          </Link>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-5 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Weather Data State */}
      {weather && !loading && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-6">
          <div className="pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Current Microclimate Conditions
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {selectedFarm?.farm_name} {selectedFarm?.location ? `• ${selectedFarm.location}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-3xl mb-2">🌡️</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Temperature</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">{Math.round(weather.temperature)}°C</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-3xl mb-2">💧</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Humidity</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">{Math.round(weather.humidity)}%</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-3xl mb-2">🌧️</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Rain Probability</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">{weather.rainProbability}%</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-3xl mb-2">💨</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Wind</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">{Math.round(weather.windSpeed * 3.6)} km/h</span>
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center text-center col-span-2 lg:col-span-1">
              <span className="text-3xl mb-2">☁️</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">Condition</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white capitalize">{weather.weatherCondition}</span>
            </div>
          </div>
        </div>
      )}

      {/* 📅 7-Day Future Weather Forecast Card */}
      {forecast.length > 0 && !loading && (
        <div className="rounded-2xl border border-blue-500/20 bg-zinc-950 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📅</span> 7-Day Agricultural Weather Forecast
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Microclimate weather predictions and field action advice for the upcoming week
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
              Next 7 Days
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {forecast.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-4 flex flex-col items-center text-center transition-all ${
                  idx === 0
                    ? "border-green-500/50 bg-green-950/30 shadow-lg shadow-green-950/40"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider mb-0.5">
                  {item.dayName}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium mb-3">{item.date}</span>

                <span className="text-3xl mb-2 animate-bounce-subtle">{item.icon}</span>

                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-lg font-black text-white">{item.tempMax}°</span>
                  <span className="text-xs text-zinc-400">{item.tempMin}°C</span>
                </div>

                <div className="w-full bg-zinc-800/80 rounded-full h-1.5 my-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, item.rainProbability)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between w-full text-[10px] text-zinc-400 font-semibold px-1 mb-3">
                  <span>🌧️ {item.rainProbability}%</span>
                  <span>💨 {item.windSpeed} km/h</span>
                </div>

                <div className="mt-auto pt-2 border-t border-zinc-800/80 text-[10px] leading-tight text-zinc-300 font-medium text-left w-full">
                  {item.agriAdvice}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Success Message */}
      {saveMessage && !loading && (
        <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 p-4 text-sm font-medium text-green-800 dark:text-green-400 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {saveMessage}
        </div>
      )}

      {/* History Section */}
      {!isGpsMissing && (
        <div className="mt-8">
          {historyLoading ? (
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            </div>
          ) : (
            <WeatherHistory history={history} />
          )}
        </div>
      )}
    </div>
  );
}
