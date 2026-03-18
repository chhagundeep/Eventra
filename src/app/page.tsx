import { redirect } from "next/navigation";

export default function Home() {
  // This sends users straight to the login screen
  redirect("/login");
}