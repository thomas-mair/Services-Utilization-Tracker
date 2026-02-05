// app/api/holiday/route.js
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const year_id = searchParams.get("year_id");

  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .eq("year_id", year_id)
    .order("month", { ascending: true });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("holidays")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase.from("holidays").delete().eq("id", id);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}
