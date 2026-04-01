import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { publicIds } = await request.json();
    
    if (!publicIds || !Array.isArray(publicIds)) {
      return NextResponse.json({ error: "Invalid publicIds" }, { status: 400 });
    }

    const result = await cloudinary.api.delete_resources(publicIds);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Cloudinary API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}