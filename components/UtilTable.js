"use client";

export default function UtilTable({ employees, onEdit }) {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  return (
    <div className="overflow-x-auto border rounded-xl p-2">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">✏️</th>
            <th className="border p-2">Employee</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">Manager</th>
            <th className="border p-2">Target</th>
            <th className="border p-2">Hire Mo</th>
            {months.map((m) => (
              <th key={m} className="border p-2 text-center">
                {m}
                <div className="text-xs text-gray-500">Actual | PTO</div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="border p-2 text-center">
                <button onClick={() => onEdit(e)}>✏️</button>
              </td>
              <td className="border p-2">{e.employee_name}</td>
              <td className="border p-2">{e.product}</td>
              <td className="border p-2">{e.manager}</td>
              <td className="border p-2 text-center">
                {e.target_mode === "previous"
                  ? e.annual_target
                  : `${e.q1_target}/${e.q2_target}/${e.q3_target}/${e.q4_target}`}
              </td>
              <td className="border p-2 text-center">{e.hire_month}</td>

              {months.map((_, i) => {
                const h =
                  e.employee_hours?.find((x) => x.month === i + 1) || {};
                return (
                  <td key={i} className="border p-2 text-center">
                    {h.actual_hours || 0} | {h.pto_hours || 0}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
