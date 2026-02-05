"use client";
import { useMemo } from "react";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function countWeekdays(year, month) {
  let d = new Date(year, month - 1, 1);
  let count = 0;
  while (d.getMonth() === month - 1) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

const utilColor = (util, target) => {
  if (util >= target) return "bg-green-100";
  if (util >= target * 0.9) return "bg-yellow-100";
  return "bg-red-100";
};

export default function UtilTable({ year, employees, holidays, onEdit }) {
  const baseByMonth = useMemo(
    () =>
      MONTHS.map((_, i) => (year ? countWeekdays(year, i + 1) * 8 : 0)),
    [year]
  );

  const holidayByMonth = useMemo(
    () =>
      MONTHS.map((_, i) =>
        holidays
          .filter((h) => h.month === i + 1)
          .reduce((s, h) => s + Number(h.hours || 0), 0)
      ),
    [holidays]
  );

  const netByMonth = baseByMonth.map(
    (b, i) => b - (holidayByMonth[i] || 0)
  );

  const upsertHours = async (employee_id, month, field, value) => {
    await fetch("/api/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id,
        month,
        [field]: Number(value || 0),
      }),
    });
  };

  const calcTotals = (hours) => {
    const actual = Array(12).fill(0);
    const pto = Array(12).fill(0);

    hours?.forEach((h) => {
      actual[h.month - 1] = Number(h.actual_hours || 0);
      pto[h.month - 1] = Number(h.pto_hours || 0);
    });

    const q = (m) => ({
      actual: actual.slice(m, m + 3).reduce((a, b) => a + b, 0),
      pto: pto.slice(m, m + 3).reduce((a, b) => a + b, 0),
    });

    return {
      actual,
      pto,
      q1: q(0),
      q2: q(3),
      q3: q(6),
      q4: q(9),
      ytd: {
        actual: actual.reduce((a, b) => a + b, 0),
        pto: pto.reduce((a, b) => a + b, 0),
      },
    };
  };

  const utilPct = (actual, net) =>
    net > 0 ? Math.min(100, Math.round((actual / net) * 100)) : 0;

  const teamAvg = useMemo(() => {
    if (!employees.length) return 0;
    let total = 0;
    employees.forEach((e) => {
      const t = calcTotals(e.employee_hours || []);
      const net = netByMonth.reduce((a, b) => a + b, 0);
      total += utilPct(t.ytd.actual, net);
    });
    return Math.round(total / employees.length);
  }, [employees, netByMonth]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Employee</th>
            <th className="border p-2">Manager</th>
            <th className="border p-2">Target</th>
            <th className="border p-2">Hire</th>

            {["Q1","Q2","Q3","Q4"].map((q, idx) => (
              <th
                key={q}
                colSpan={3}
                className="border bg-[#9b0f3a] text-white text-center"
              >
                {q}
              </th>
            ))}

            <th className="border p-2">YTD</th>
          </tr>

          <tr className="bg-gray-100">
            <th className="border p-2"></th>
            <th className="border p-2"></th>
            <th className="border p-2"></th>
            <th className="border p-2"></th>

            {MONTHS.map((m) => (
              <th key={m} className="border p-2 text-center">
                {m}
                <div className="text-xs text-gray-500">Actual | PTO</div>
              </th>
            ))}

            <th className="border p-2 text-center">Util</th>
          </tr>
        </thead>

        <tbody>
          {/* Base / Holiday / Net rows */}
          <tr className="bg-gray-50 font-semibold">
            <td colSpan={4} className="border p-2">Base Hours →</td>
            {baseByMonth.map((b,i)=>(<td key={i} className="border p-2 text-center">{b}</td>))}
            <td></td>
          </tr>

          <tr className="bg-gray-50 font-semibold">
            <td colSpan={4} className="border p-2">Holidays →</td>
            {holidayByMonth.map((h,i)=>(<td key={i} className="border p-2 text-center">{h}</td>))}
            <td></td>
          </tr>

          <tr className="bg-gray-50 font-semibold">
            <td colSpan={4} className="border p-2">Net Available →</td>
            {netByMonth.map((n,i)=>(<td key={i} className="border p-2 text-center">{n}</td>))}
            <td></td>
          </tr>

          {employees.map((e) => {
            const totals = calcTotals(e.employee_hours || []);
            const netTotal = netByMonth.reduce((a, b) => a + b, 0);
            const ytdUtil = utilPct(totals.ytd.actual, netTotal);

            return (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="border p-2">{e.employee_name}</td>
                <td className="border p-2">{e.manager}</td>
                <td className="border p-2 text-center">
                  {e.annual_target}
                </td>
                <td className="border p-2 text-center">{e.hire_month}</td>

                {MONTHS.map((_, i) => (
                  <td key={i} className="border p-1 text-center">
                    <div className="flex gap-1 justify-center">
                      <input
                        className="w-[47%] text-center border rounded"
                        value={totals.actual[i]}
                        onChange={(ev) =>
                          upsertHours(e.id, i + 1, "actual_hours", ev.target.value)
                        }
                      />
                      <input
                        className="w-[47%] text-center border rounded"
                        value={totals.pto[i]}
                        onChange={(ev) =>
                          upsertHours(e.id, i + 1, "pto_hours", ev.target.value)
                        }
                      />
                    </div>
                  </td>
                ))}

                <td className={`border p-2 text-center ${utilColor(ytdUtil, e.annual_target)}`}>
                  {ytdUtil}%
                </td>
              </tr>
            );
          })}

          <tr className="bg-gray-100 font-semibold">
            <td colSpan={4} className="border p-2">Team Average</td>
            {Array(12).fill(null).map((_, i) => (
              <td key={i} className="border p-2"></td>
            ))}
            <td className="border p-2 text-center">{teamAvg}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
