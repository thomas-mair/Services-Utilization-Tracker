"use client";
import { useMemo, useState } from "react";

// Count weekdays in a month
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

function utilColor(util, target) {
  if (util >= target) return "bg-green-200";
  if (util >= target * 0.9) return "bg-yellow-200";
  return "bg-red-200";
}

export default function UtilTable({
  year,
  employees,
  holidays,
  onEdit,
  onFilter,
}) {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const [sort, setSort] = useState({ key: null, dir: null });

  const sortedEmployees = useMemo(() => {
    if (!sort.key || !sort.dir) return employees;
    return [...employees].sort((a, b) => {
      if (a[sort.key] < b[sort.key]) return sort.dir === "asc" ? -1 : 1;
      if (a[sort.key] > b[sort.key]) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [employees, sort]);

  const toggleSort = (key) => {
    setSort((s) => {
      if (s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      if (s.dir === "desc") return { key: null, dir: null };
      return { key, dir: "asc" };
    });
  };

  const baseByMonth = useMemo(
    () =>
      months.map((_, i) => (year ? countWeekdays(year, i + 1) * 8 : 0)),
    [year]
  );

  const holidayByMonth = useMemo(
    () =>
      months.map((_, i) =>
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

    const q1 = q(0), q2 = q(3), q3 = q(6), q4 = q(9);
    const ytd = {
      actual: actual.reduce((a, b) => a + b, 0),
      pto: pto.reduce((a, b) => a + b, 0),
    };

    return { actual, pto, q1, q2, q3, q4, ytd };
  };

  const utilPct = (actual, pto, net) =>
    net > 0 ? Math.min(100, Math.round((actual / net) * 100)) : 0;

  return (
    <div className="overflow-x-auto border rounded-xl p-2">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">✏️</th>
            {["employee_name","product","manager","annual_target","hire_month"].map((k) => (
              <th
                key={k}
                className="border p-2 cursor-pointer"
                onClick={() => toggleSort(k)}
              >
                {k.replace("_"," ")}
              </th>
            ))}
            {months.map((m) => (
              <th key={m} className="border p-2 text-center">
                {m}
                <div className="text-xs text-gray-500">Actual | PTO</div>
              </th>
            ))}
            <th className="border p-2">Q1</th>
            <th className="border p-2">Q2</th>
            <th className="border p-2">Q3</th>
            <th className="border p-2">Q4</th>
            <th className="border p-2">YTD</th>
          </tr>
        </thead>

        <tbody>
          {/* SUMMARY ROWS */}
          <tr className="bg-gray-50 font-semibold">
            <td colSpan={5} className="border p-2">Base Hours</td>
            {baseByMonth.map((b,i)=>(<td key={i} className="border p-2 text-center">{b}</td>))}
            <td colSpan={5}></td>
          </tr>

          <tr className="bg-gray-50 font-semibold">
            <td colSpan={5} className="border p-2">Holidays</td>
            {holidayByMonth.map((h,i)=>(<td key={i} className="border p-2 text-center">{h}</td>))}
            <td colSpan={5}></td>
          </tr>

          <tr className="bg-gray-50 font-semibold">
            <td colSpan={5} className="border p-2">Net Available</td>
            {netByMonth.map((n,i)=>(<td key={i} className="border p-2 text-center">{n}</td>))}
            <td colSpan={5}></td>
          </tr>

          {/* EMPLOYEE ROWS */}
          {sortedEmployees.map((e) => {
            const totals = calcTotals(e.employee_hours || []);
            const target =
              e.target_mode === "previous"
                ? Number(e.annual_target || 0)
                : null;

            return (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="border p-2 text-center">
                  <button onClick={() => onEdit(e)}>✏️</button>
                </td>

                <td className="border p-2">{e.employee_name}</td>

                <td
                  className="border p-2 cursor-pointer text-blue-600"
                  onClick={() => onFilter({ type: "product", value: e.product })}
                >
                  {e.product}
                </td>

                <td
                  className="border p-2 cursor-pointer text-blue-600"
                  onClick={() => onFilter({ type: "manager", value: e.manager })}
                >
                  {e.manager}
                </td>

                <td className="border p-2 text-center">
                  {e.target_mode === "previous"
                    ? target
                    : `${e.q1_target}/${e.q2_target}/${e.q3_target}/${e.q4_target}`}
                </td>

                <td className="border p-2 text-center">{e.hire_month}</td>

                {months.map((_, i) => {
                  const net = netByMonth[i];
                  const util = utilPct(totals.actual[i], totals.pto[i], net);
                  const cellClass = utilColor(
                    util,
                    e.target_mode === "previous"
                      ? target
                      : i < 3
                      ? e.q1_target
                      : i < 6
                      ? e.q2_target
                      : i < 9
                      ? e.q3_target
                      : e.q4_target
                  );

                  return (
                    <td key={i} className={`border p-1 text-center ${cellClass}`}>
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
                      <div className="text-xs mt-1">{util}%</div>
                    </td>
                  );
                })}

                {[totals.q1, totals.q2, totals.q3, totals.q4, totals.ytd].map(
                  (t, idx) => {
                    const net = netByMonth
                      .slice(idx * 3, idx * 3 + 3)
                      .reduce((a, b) => a + b, 0);

                    const target =
                      e.target_mode === "previous"
                        ? e.annual_target
                        : idx === 0
                        ? e.q1_target
                        : idx === 1
                        ? e.q2_target
                        : idx === 2
                        ? e.q3_target
                        : e.q4_target;

                    const util = utilPct(t.actual, t.pto, net);

                    return (
                      <td
                        key={idx}
                        className={`border p-2 text-center ${utilColor(
                          util,
                          target
                        )}`}
                      >
                        <div>
                          {t.actual} | {t.pto}
                        </div>
                        <div className="text-xs">{util}%</div>
                      </td>
                    );
                  }
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
