import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ratelimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    // Rate limiting - máximo 5 intentos por minuto por IP
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success: rateLimitSuccess } = await ratelimit.limit(ip);

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: "Demasiados intentos de login. Intenta de nuevo en un minuto." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { error: "Datos inválidos. Por favor verifica tu información." },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos. Por favor verifica tu información.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET no está configurado");
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    // Crear token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Extendido a 7 días para mejor UX
    );

    // Crear respuesta con cookie segura
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    
    // No exponer detalles del error en producción
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Error interno del servidor. Por favor intenta de nuevo." },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { 
          error: "Error interno del servidor", 
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  }
}
