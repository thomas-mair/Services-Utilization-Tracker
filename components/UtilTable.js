"use client";
import { useMemo } from "react";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const QUARTERS = { Q1: [0,1,2], Q2: [3,4,5], Q3: [6,7,8], Q4: [9,10,11] };

// Weekdays * 8 hours
function countWeekdays(year, month) {
  let d = new Date(year, month, 1);
  let count = 0;
  while (d.getMonth() === month) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count * 8;
}

const utilColor = (util, target) => {
  if (util === 0) return "bg-[#e9ecef] text-[#495057]";
  if (util >= target) return "bg-[#d4edda] text-[#155724]";
  if (util >= target - 5) return "bg-[#fff3cd] text-[#856404]";
  return "bg-[#f8d7da] text-[#721c24]";
};

export default function UtilTable({
  year,
  employees,
  holidays,
  locked = false,
  onEdit,
}) {
  const baseByMonth = useMemo(
    () => MONTHS.map((_, i) => (year ? countWeekdays(year, i) : 0)),
    [year]
  );

  const holidayByMonth = useMemo(
    () =>
      MONTHS.map(
        (_, i) =>
          holidays.filter(
            (h) => new Date(h.date + "T00:00:00").getMonth() === i
          ).length * 8
      ),
    [holidays]
  );

  const netByMonth = baseByMonth.map(
    (b, i) => b - (holidayByMonth[i] || 0)
  );

  const upsertHours = async (employee_id, monthIdx, field, value) => {
    if (locked) return; // HARD LOCK

    await fetch("/api/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id,
        month: monthIdx + 1,
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

    const quarter = (q) => {
      const months = QUARTERS[q];
      return {
        actual: months.reduce((s, m) => s + actual[m], 0),
        pto: months.reduce((s, m) => s + pto[m], 0),
        net: months.reduce((s, m) => s + netByMonth[m], 0),
      };
    };

    const q1 = quarter("Q1");
    const q2 = quarter("Q2");
    const q3 = quarter("Q3");
    const q4 = quarter("Q4");

    const ytdNet = netByMonth.reduce((a, b) => a + b, 0);
    const ytdActual = actual.reduce((a, b) => a + b, 0);
    const ytdPto = pto.reduce((a, b) => a + b, 0);

    return { actual, pto, q1, q2, q3, q4, ytdActual, ytdPto, ytdNet };
  };

  const utilPct = (actual, net, pto = 0) =>
    net - pto > 0 ? Math.min(100, (actual / (net - pto)) * 100) : 0;

  const teamAverages = useMemo(() => {
    if (!employees.length) return { q: [0, 0, 0, 0], ytd: 0 };

    const qSums = [0, 0, 0, 0];
    let ytdSum = 0;

    employees.forEach((e) => {
      const t = calcTotals(e.employee_hours || []);
      const qs = [t.q1, t.q2, t.q3, t.q4];
      qs.forEach((q, i) => {
        qSums[i] += utilPct(q.actual, q.net, q.pto);
      });
      ytdSum += utilPct(t.ytdActual, t.ytdNet, t.ytdPto);
    });

    return {
      q: qSums.map((s) => s / employees.length),
      ytd: ytdSum / employees.length,
    };
  }, [employees, netByMonth]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 bg-[#f8f9fa] z-20 w-[150px] border"
            >
              Employee
            </th>
            <th
              rowSpan={2}
              className="sticky left-[150px] bg-[#f8f9fa] z-20 w-[150px] border"
            >
              Manager
            </th>
            <th
              rowSpan={2}
              className="sticky left-[300px] bg-[#f8f9fa] z-20 w-[100px] border"
            >
              Target
            </th>
            <th
              rowSpan={2}
              className="sticky left-[400px] bg-[#f8f9fa] z-20 w-[150px] border"
            >
              Hire
            </th>

            {MONTHS.map((m, i) => {
              const isQE = (i + 1) % 3 === 0;
              return (
                <>
                  <th
                    key={m}
                    colSpan={2}
                    className="bg-[#e9ecef] text-center text-xs border"
                  >
                    {m}
                  </th>
                  {isQE && (
                    <th className="bg-[#8E1537] text-white text-center font-bold border">
                      Q{Math.floor(i / 3) + 1}
                    </th>
                  )}
                </>
              );
            })}
            <th
              rowSpan={2}
              className="bg-[#8E1537] text-white border text-center"
            >
              YTD
            </th>
          </tr>

          <tr>
            {MONTHS.map((_, i) => {
              const isQE = (i + 1) % 3 === 0;
              return (
                <>
                  <th
                    key={`a-${i}`}
                    className="bg-[#e9ecef] text-center text-xs border"
                  >
                    Actual
                  </th>
                  <th
                    key={`p-${i}`}
                    className="bg-[#e9ecef] text-center text-xs border"
                  >
                    PTO
                  </th>
                  {isQE && (
                    <th className="bg-[#8E1537] text-white text-center text-xs border">
                      Util
                    </th>
                  )}
                </>
              );
            })}
          </tr>

          {/* Base / Holidays / Net rows */}
          <tr className="bg-[#f1f3f5] font-bold">
            <th colSpan={4}>Base Hours →</th>
            {MONTHS.map((_, i) => {
              const isQE = (i + 1) % 3 === 0;
              const qTotal = isQE
                ? QUARTERS[`Q${Math.floor(i / 3) + 1}`].reduce(
                    (s, m) => s + baseByMonth[m],
                    0
                  )
                : null;
              return (
                <>
                  <th key={`b-${i}`} colSpan={2} className="text-center">
                    {baseByMonth[i]}
                  </th>
                  {isQE && <th className="text-center">{qTotal}</th>}
                </>
              );
            })}
            <th></th>
          </tr>

          <tr className="bg-[#f1f3f5] font-bold text-red-600">
            <th colSpan={4}>Holidays →</th>
            {MONTHS.map((_, i) => {
              const isQE = (i + 1) % 3 === 0;
              const qTotal = isQE
                ? QUARTERS[`Q${Math.floor(i / 3) + 1}`].reduce(
                    (s, m) => s + holidayByMonth[m],
                    0
                  )
                : null;
              return (
                <>
                  <th key={`h-${i}`} colSpan={2} className="text-center">
                    -{holidayByMonth[i]}
                  </th>
                  {isQE && <th className="text-center">-{qTotal}</th>}
                </>
              );
            })}
            <th></th>
          </tr>

          <tr className="bg-[#f1f3f5] font-bold text-blue-600">
            <th colSpan={4}>Net Available →</th>
            {MONTHS.map((_, i) => {
              const isQE = (i + 1) % 3 === 0;
              const qTotal = isQE
                ? QUARTERS[`Q${Math.floor(i / 3) + 1}`].reduce(
                    (s, m) => s + netByMonth[m],
                    0
                  )
                : null;
              return (
                <>
                  <th key={`n-${i}`} colSpan={2} className="text-center">
                    {netByMonth[i]}
                  </th>
                  {isQE && <th className="text-center">{qTotal}</th>}
                </>
              );
            })}
            <th></th>
          </tr>
        </thead>

        <tbody>
          {employees.map((e) => {
            const t = calcTotals(e.employee_hours || []);
            const qs = [t.q1, t.q2, t.q3, t.q4];

            return (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white border px-2">
                  <button
                    onClick={() => !locked && onEdit(e)}
                    className={`mr-1 ${
                      locked ? "opacity-30 cursor-not-allowed" : ""
                    }`}
                  >
                    ✏️
                  </button>
                  <strong>{e.employee_name}</strong>
                </td>
                <td className="sticky left-[150px] bg-white border px-2">
                  {e.manager}
                </td>
                <td className="sticky left-[300px] bg-white border text-center">
                  {e.annual_target}%
                </td>
                <td className="sticky left-[400px] bg-white border text-center">
                  {e.hire_month}
                </td>

                {MONTHS.map((_, i) => {
                  const isQE = (i + 1) % 3 === 0;
                  const qIdx = Math.floor(i / 3);
                  const util =
                    isQE &&
                    utilPct(
                      qs[qIdx].actual,
                      qs[qIdx].net,
                      qs[qIdx].pto
                    );

                  return (
                    <>
                      <td key={`a-${i}`} className="border text-center">
                        <input
                          className={`w-[70px] text-center border rounded ${
                            locked ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          value={t.actual[i]}
                          onChange={(ev) =>
                            upsertHours(
                              e.id,
                              i,
                              "actual_hours",
                              ev.target.value
                            )
                          }
                          disabled={locked}
                        />
                      </td>
                      <td key={`p-${i}`} className="border text-center">
                        <input
                          className={`w-[70px] text-center border rounded ${
                            locked ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          value={t.pto[i]}
                          onChange={(ev) =>
                            upsertHours(
                              e.id,
                              i,
                              "pto_hours",
                              ev.target.value
                            )
                          }
                          disabled={locked}
                        />
                      </td>
                      {isQE && (
                        <td
                          className={`border text-center font-semibold ${utilColor(
                            util,
                            e.annual_target
                          )}`}
                        >
                          {util.toFixed(2)}%
                        </td>
                      )}
                    </>
                  );
                })}

                <td
                  className={`border text-center font-semibold ${utilColor(
                    utilPct(t.ytdActual, t.ytdNet, t.ytdPto),
                    e.annual_target
                  )}`}
                >
                  {utilPct(
                    t.ytdActual,
                    t.ytdNet,
                    t.ytdPto
                  ).toFixed(2)}
                  %
                </td>
              </tr>
            );
          })}

          {/* Team Average Row */}
          <tr className="bg-[#f1f3f5] font-bold">
            <td colSpan={4} className="border px-2">
              Team Average
            </td>
            {MONTHS.map((_, i) => {
              const isQE = (i + 1) % 3 === 0;
              const qIdx = Math.floor(i / 3);
              return (
                <>
                  <td key={`ta-${i}`} colSpan={2} className="border"></td>
                  {isQE && (
                    <td className="border text-center">
                      {teamAverages.q[qIdx].toFixed(2)}%
                    </td>
                  )}
                </>
              );
            })}
            <td className="border text-center">
              {teamAverages.ytd.toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
