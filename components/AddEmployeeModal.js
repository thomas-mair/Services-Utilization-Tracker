"use client";
import { useState } from "react";

export default function AddEmployeeModal({ isOpen, onClose, onSave, employee }) {
  const [form, setForm] = useState(
    employee || {
      employee_name: "",
      product: "",
      manager: "",
      hire_month: 1,
      target_mode: "previous",
      annual_target: 75,
      q1_target: 75,
      q2_target: 75,
      q3_target: 75,
      q4_target: 75,
    }
  );

  if (!isOpen) return null;

  const update = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[500px]">
        <h2 className="text-xl font-bold mb-4">
          {employee ? "Edit Employee" : "Add Employee"}
        </h2>

        <div className="grid gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Employee Name"
            value={form.employee_name}
            onChange={(e) => update("employee_name", e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Product"
            value={form.product}
            onChange={(e) => update("product", e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Manager"
            value={form.manager}
            onChange={(e) => update("manager", e.target.value)}
          />

          <select
            className="border p-2 rounded"
            value={form.hire_month}
            onChange={(e) => update("hire_month", Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Month {i + 1}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={form.target_mode}
            onChange={(e) => update("target_mode", e.target.value)}
          >
            <option value="previous">Previous (Annual)</option>
            <option value="quarterly">Quarterly</option>
          </select>

          {form.target_mode === "previous" ? (
            <input
              className="border p-2 rounded"
              type="number"
              value={form.annual_target}
              onChange={(e) => update("annual_target", Number(e.target.value))}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {["q1", "q2", "q3", "q4"].map((q) => (
                <input
                  key={q}
                  className="border p-2 rounded"
                  type="number"
                  placeholder={q.toUpperCase()}
                  value={form[`${q}_target`]}
                  onChange={(e) =>
                    update(`${q}_target`, Number(e.target.value))
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            className="bg-gray-200 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => onSave(form)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
