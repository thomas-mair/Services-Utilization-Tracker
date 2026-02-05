"use client";
import { useMemo } from "react";

function bar(percent) {
  return (
    <div className="w-full bg-gray-200 rounded h-4">
      <div
        className="bg-[#8E1537] h-4 rounded"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export default function Dashboard({ year, employees, holidays }) {
  const calcQuarterUtil = (emps) => {
    if (!emps.length) return [0, 0, 0, 0];

    const sums = [0, 0, 0, 0];
    emps.forEach((e) => {
      const actual = Array(12).fill(0);
      (e.employee_hours || []).forEach(
        (h) => (actual[h.month - 1] = Number(h.actual_hours || 0))
      );

      for (let q = 0; q < 4; q++) {
        const quarterActual = actual
          .slice(q * 3, q * 3 + 3)
          .reduce((a, b) => a + b, 0);
        sums[q] += quarterActual;
      }
    });

    return sums.map((s) => Math.round((s / emps.length) / 16)); // rough scaling
  };

  const qUtils = useMemo(
    () => calcQuarterUtil(employees),
    [employees]
  );

  const ytd = useMemo(() => {
    if (!employees.length) return 0;
    let total = 0;
    employees.forEach((e) => {
      (e.employee_hours || []).forEach((h) => {
        total += Number(h.actual_hours || 0);
      });
    });
    return Math.round(total / employees.length / 48);
  }, [employees]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold mb-2">Quarterly Utilization</h2>
        {["Q1", "Q2", "Q3", "Q4"].map((q, i) => (
          <div key={q} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>{q}</span>
              <span>{qUtils[i]}%</span>
            </div>
            {bar(qUtils[i])}
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-bold mb-2">YTD Utilization</h2>
        <div className="flex justify-between text-sm mb-1">
          <span>YTD</span>
          <span>{ytd}%</span>
        </div>
        {bar(ytd)}
      </div>
    </div>
  );
}
