import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "node:module";
import { getErrorMessage } from "@/lib/server/http";
import { LegacyServices } from "@/lib/server/legacy";

const requireFromHere = createRequire(import.meta.url);
const bcrypt = requireFromHere("bcryptjs") as {
  compare(plainText: string, hash: string): Promise<boolean>;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const db = LegacyServices.FirebaseConnection.getInstance().db;
    const usersRef = db.collection("user");
    const query = usersRef.where("email", "==", email);
    const snapshot = await query.get();

    if (snapshot.empty) {
      throw new Error("Usuario nao encontrado.");
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      throw new Error("Senha incorreta.");
    }

    const token = userData;
    return NextResponse.json({ success: true, token }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 400 }
    );
  }
}
