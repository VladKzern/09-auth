import { NextRequest, NextResponse } from "next/server";
import { api } from "@/app/api/api";
import { parse } from "cookie";
import { logErrorResponse } from "../../_utils/utils";
import { isAxiosError } from "axios";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    if (!cookieHeader) return NextResponse.json({ success: false }, { status: 200 });
    
    const apiRes = await api.get("/auth/session", {
      headers: { Cookie: cookieHeader },
    });

    const setCookie = apiRes.headers["set-cookie"];
    const response = NextResponse.json({ success: true }, { status: 200 });

    if (setCookie) {
      const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
      for (const cookieStr of cookieArray) {
        const parsed = parse(cookieStr);

        const options = {
          path: parsed.Path || "/",
          expires: parsed.Expires ? new Date(parsed.Expires) : undefined,
          maxAge: parsed["Max-Age"] ? Number(parsed["Max-Age"]) : undefined,
        };

        if (parsed.accessToken) response.cookies.set("accessToken", parsed.accessToken, options);
        if (parsed.refreshToken) response.cookies.set("refreshToken", parsed.refreshToken, options);
      }
    }

    return response;
  } catch (error) {
    if (isAxiosError(error)) {
      logErrorResponse(error.response?.data);
    } else {
      logErrorResponse({ message: (error as Error).message });
    }
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
