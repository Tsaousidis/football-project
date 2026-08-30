"use client";

import { useState } from "react";

type ScheduleSettingsValue = {
  enabled: boolean;
  frequency: "daily" | "weekly";
  dayOfWeek: number;
  runTime: string;
  timezone: string;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ScheduleSettings({ initialSettings }: { initialSettings: ScheduleSettingsValue }) {
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateSettings = <Key extends keyof ScheduleSettingsValue>(key: Key, value: ScheduleSettingsValue[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setStatus(null);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save schedule settings.");
      }

      setSettings(payload.settings);
      setStatus("Schedule settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save schedule settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Automatic research</p>
          <h2 className="mt-2 text-xl font-bold text-white">Schedule updates</h2>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
          <input type="checkbox" checked={settings.enabled} onChange={(event) => updateSettings("enabled", event.target.checked)} className="h-4 w-4 accent-emerald-500" />
          Enable schedule
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          Frequency
          <select value={settings.frequency} onChange={(event) => updateSettings("frequency", event.target.value as ScheduleSettingsValue["frequency"])} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-100">
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
          </select>
        </label>

        {settings.frequency === "weekly" ? (
          <label className="text-sm text-slate-300">
            Day
            <select value={settings.dayOfWeek} onChange={(event) => updateSettings("dayOfWeek", Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-100">
              {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
            </select>
          </label>
        ) : null}

        <label className="text-sm text-slate-300">
          Run time
          <input type="time" value={settings.runTime} onChange={(event) => updateSettings("runTime", event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-100" />
        </label>

        <label className="text-sm text-slate-300">
          Timezone
          <input type="text" value={settings.timezone} onChange={(event) => updateSettings("timezone", event.target.value)} placeholder="Europe/Athens" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={saveSettings} disabled={isSaving} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? "Saving..." : "Save schedule"}
        </button>
        {status ? <span className="text-sm text-slate-300">{status}</span> : null}
      </div>
    </section>
  );
}