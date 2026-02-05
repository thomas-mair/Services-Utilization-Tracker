// app/api/hours/route.js
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json(); 
  // { employee_id, month, actual_hours, pto_hours }

  const { data, error } = await supabase
    .from("employee_hours")
    .upsert(body, { onConflict: "employee_id,month" })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}
