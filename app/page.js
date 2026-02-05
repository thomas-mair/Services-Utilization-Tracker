"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import UtilTable from "@/components/UtilTable";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import HolidaysModal from "@/components/HolidaysModal";
import Dashboard from "@/components/Dashboard";

export default function Page() {
  const [year, setYear] = useState(null);
  const [years, setYears] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [showHolModal, setShowHolModal] = useState(false);

  const [view, setView] = useState("table"); // "table" | "dashboard"
  const [managerFilter, setManagerFilter] = useState("ALL");
  const [locked, setLocked] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Load years
  useEffect(() => {
    fetch("/api/year")
      .then((r) => r.json())
      .then((yrs) => {
        setYears(yrs);
        if (yrs.length) setYear(yrs[0]);
      });
  }, []);

  // Load data + realtime
  useEffect(() => {
    if (!year) return;

    const load = async () => {
      const emps = await fetch(`/api/employee?year_id=${year.id}`).then((r) =>
        r.json()
      );
      const hols = await fetch(`/api/holiday?year_id=${year.id}`).then((r) =>
        r.json()
      );
      setEmployees(emps);
      setHolidays(hols);
    };

    load();

    const subs = [
      supabase
        .channel("employees")
        .on("postgres_changes", { event: "*", table: "employees" }, load)
        .subscribe(),
      supabase
        .channel("hours")
        .on("postgres_changes", { event: "*", table: "employee_hours" }, load)
        .subscribe(),
      supabase
        .channel("holidays")
        .on("postgres_changes", { event: "*", table: "holidays" }, load)
        .subscribe(),
    ];

    return () => subs.forEach((s) => s.unsubscribe());
  }, [year]);

  const saveEmployee = async (emp) => {
    const method = emp.id ? "PUT" : "POST";
    await fetch("/api/employee", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...emp, year_id: year.id }),
    });
    setShowEmpModal(false);
  };

  const addHoliday = async (h) => {
    await fetch("/api/holiday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...h, year_id: year.id }),
    });
  };

  const deleteHoliday = async (id) => {
    await fetch(`/api/holiday?id=${id}`, { method: "DELETE" });
  };

  // Create next year (copy employees)
  const createNextYear = async () => {
    const nextYear = year.year + 1;
    const newYear = await fetch("/api/year", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: nextYear }),
    }).then((r) => r.json());

    for (const e of employees) {
      const { id, employee_hours, ...rest } = e;
      await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, year_id: newYear.id }),
      });
    }

    setYears([newYear, ...years]);
    setYear(newYear);
  };

  const filteredEmployees = useMemo(() => {
    if (managerFilter === "ALL") return employees;
    return employees.filter((e) => e.manager === managerFilter);
  }, [employees, managerFilter]);

  const exportCSV = () => {
    let csv = "Employee,Manager,Month,Actual,PTO\n";
    filteredEmployees.forEach((e) => {
      (e.employee_hours || []).forEach((h) => {
        csv += `${e.employee_name},${e.manager},${h.month},${h.actual_hours},${h.pto_hours}\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utilization-${year.year}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8E1537] to-[#E97300] text-white px-8 py-6">
        <h1 className="text-2xl font-bold">
          Professional Services Utilization Tracker
        </h1>
        <p className="text-sm opacity-90">
          Track billable hours, PTO, and utilization across your team
        </p>
      </div>

      <div className="max-w-[1800px] mx-auto bg-white shadow rounded-b-lg">
        {/* Top controls */}
        <div className="p-4 flex flex-wrap gap-2 items-center border-b bg-[#fafafa]">
          <select
            className="border p-2 rounded"
            value={year?.id || ""}
            onChange={(e) =>
              setYear(years.find((y) => y.id === e.target.value))
            }
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.year}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
          >
            <option value="ALL">All Managers</option>
            {[...new Set(employees.map((e) => e.manager))].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            className={`px-4 py-2 rounded ${
              view === "table" ? "bg-[#8E1537] text-white" : "bg-gray-200"
            }`}
            onClick={() => setView("table")}
          >
            Table View
          </button>

          <button
            className={`px-4 py-2 rounded ${
              view === "dashboard" ? "bg-[#8E1537] text-white" : "bg-gray-200"
            }`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>

          <button
            className="bg-[#8E1537] text-white px-4 py-2 rounded"
            onClick={() => {
              setEditingEmp(null);
              setShowEmpModal(true);
            }}
          >
            + Add Employee
          </button>

          <button
            className="bg-gray-700 text-white px-4 py-2 rounded"
            onClick={() => setShowHolModal(true)}
          >
            Holidays ({holidays.length})
          </button>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Recalc Hours
          </button>

          <button
            className="bg-orange-600 text-white px-4 py-2 rounded"
            onClick={createNextYear}
          >
            Create {year?.year + 1}
          </button>

          <button
            className={`px-4 py-2 rounded ${
              locked ? "bg-red-600 text-white" : "bg-gray-300"
            }`}
            onClick={() => setLocked(!locked)}
          >
            {locked ? "Unlock Year" : "Lock Year"}
          </button>

          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Save Data
          </button>

          <button
            className="bg-gray-700 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Load Data
          </button>

          <button
            className="bg-teal-600 text-white px-4 py-2 rounded"
            onClick={exportCSV}
          >
            Export CSV
          </button>

          <button
            className="bg-purple-600 text-white px-4 py-2 rounded"
            onClick={() => setShowDebug(!showDebug)}
          >
            Show Debug
          </button>
        </div>

        <div className="p-4">
          {view === "table" ? (
            <UtilTable
              year={year?.year}
              employees={filteredEmployees}
              holidays={holidays}
              locked={locked}
              onEdit={(e) => {
                if (!locked) {
                  setEditingEmp(e);
                  setShowEmpModal(true);
                }
              }}
            />
          ) : (
            <Dashboard
              year={year?.year}
              employees={filteredEmployees}
              holidays={holidays}
            />
          )}
        </div>

        {showDebug && (
          <pre className="bg-gray-100 p-4 text-xs overflow-auto">
            {JSON.stringify({ year, employees, holidays }, null, 2)}
          </pre>
        )}
      </div>

      <AddEmployeeModal
        isOpen={showEmpModal}
        employee={editingEmp}
        onClose={() => setShowEmpModal(false)}
        onSave={saveEmployee}
      />

      <HolidaysModal
        isOpen={showHolModal}
        holidays={holidays}
        onAdd={addHoliday}
        onDelete={deleteHoliday}
        onClose={() => setShowHolModal(false)}
      />
    </div>
  );
}
