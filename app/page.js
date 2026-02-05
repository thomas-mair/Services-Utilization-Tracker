"use client";
import { useEffect, useState } from "react";
import UtilTable from "@/components/UtilTable";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import HolidaysModal from "@/components/HolidaysModal";

export default function Page() {
  const [year, setYear] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [showHolModal, setShowHolModal] = useState(false);

  useEffect(() => {
    fetch("/api/year")
      .then((r) => r.json())
      .then((yrs) => {
        if (yrs.length) setYear(yrs[0]);
      });
  }, []);

  useEffect(() => {
    if (!year) return;
    fetch(`/api/employee?year_id=${year.id}`)
      .then((r) => r.json())
      .then(setEmployees);

    fetch(`/api/holiday?year_id=${year.id}`)
      .then((r) => r.json())
      .then(setHolidays);
  }, [year]);

  const saveEmployee = async (emp) => {
    const method = emp.id ? "PUT" : "POST";

    const res = await fetch("/api/employee", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...emp, year_id: year.id }),
    });

    const saved = await res.json();
    setShowEmpModal(false);

    // refresh
    const list = await fetch(`/api/employee?year_id=${year.id}`).then((r) =>
      r.json()
    );
    setEmployees(list);
  };

  const addHoliday = async (h) => {
    const res = await fetch("/api/holiday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...h, year_id: year.id }),
    });
    const saved = await res.json();
    setHolidays([...holidays, saved]);
  };

  const deleteHoliday = async (id) => {
    await fetch(`/api/holiday?id=${id}`, { method: "DELETE" });
    setHolidays(holidays.filter((h) => h.id !== id));
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Utilization Tracker — {year?.year}
        </h1>

        <div className="space-x-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setEditingEmp(null);
              setShowEmpModal(true);
            }}
          >
            + Add Employee
          </button>

          <button
            className="bg-purple-600 text-white px-4 py-2 rounded"
            onClick={() => setShowHolModal(true)}
          >
            Manage Holidays
          </button>
        </div>
      </div>

      <UtilTable
        employees={employees}
        onEdit={(e) => {
          setEditingEmp(e);
          setShowEmpModal(true);
        }}
      />

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
