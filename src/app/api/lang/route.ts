import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { lang } = await req.json();
    if (lang !== "en" && lang !== "ar") {
      return NextResponse.json({ error: "Invalid lang" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("lang", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}