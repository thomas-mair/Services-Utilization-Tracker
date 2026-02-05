"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  const [filter, setFilter] = useState({ type: null, value: null });

  // Ensure a year exists (bootstrap)
  useEffect(() => {
    const initYear = async () => {
      const yrs = await fetch("/api/year").then((r) => r.json());

      if (yrs.length === 0) {
        const thisYear = new Date().getFullYear();
        const created = await fetch("/api/year", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: thisYear }),
        }).then((r) => r.json());
        setYear(created);
      } else {
        setYear(yrs[0]);
      }
    };
    initYear();
  }, []);

  // Load data + realtime subscriptions
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

    const empSub = supabase
      .channel("employees")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        load
      )
      .subscribe();

    const hrsSub = supabase
      .channel("hours")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_hours" },
        load
      )
      .subscribe();

    const holSub = supabase
      .channel("holidays")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "holidays" },
        load
      )
      .subscribe();

    return () => {
      empSub.unsubscribe();
      hrsSub.unsubscribe();
      holSub.unsubscribe();
    };
  }, [year]);

  const filteredEmployees = useMemo(() => {
    if (!filter.type) return employees;
    return employees.filter((e) => e[filter.type] === filter.value);
  }, [employees, filter]);

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

          {filter.type && (
            <button
              className="bg-gray-200 px-4 py-2 rounded"
              onClick={() => setFilter({ type: null, value: null })}
            >
              Back to all
            </button>
          )}
        </div>
      </div>

      <UtilTable
        year={year?.year}
        employees={filteredEmployees}
        holidays={holidays}
        onEdit={(e) => {
          setEditingEmp(e);
          setShowEmpModal(true);
        }}
        onFilter={setFilter}
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
