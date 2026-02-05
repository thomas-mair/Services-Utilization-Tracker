"use client";
import { useState } from "react";

export default function HolidaysModal({ isOpen, holidays, onAdd, onDelete, onClose }) {
  const [form, setForm] = useState({ month: 1, holiday_name: "", hours: 8 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[500px]">
        <h2 className="text-xl font-bold mb-4">Holidays</h2>

        <div className="grid gap-3 mb-4">
          <select
            className="border p-2 rounded"
            value={form.month}
            onChange={(e) =>
              setForm({ ...form, month: Number(e.target.value) })
            }
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Month {i + 1}
              </option>
            ))}
          </select>

          <input
            className="border p-2 rounded"
            placeholder="Holiday name"
            value={form.holiday_name}
            onChange={(e) =>
              setForm({ ...form, holiday_name: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            type="number"
            value={form.hours}
            onChange={(e) =>
              setForm({ ...form, hours: Number(e.target.value) })
            }
          />

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => onAdd(form)}
          >
            Add Holiday
          </button>
        </div>

        <div className="border-t pt-4">
          {holidays.map((h) => (
            <div key={h.id} className="flex justify-between py-1">
              <span>
                M{h.month}: {h.holiday_name} ({h.hours}h)
              </span>
              <button
                className="text-red-600"
                onClick={() => onDelete(h.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <button
          className="mt-4 bg-gray-200 px-4 py-2 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
