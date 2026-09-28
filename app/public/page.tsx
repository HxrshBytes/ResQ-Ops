import { redirect } from "next/navigation";

export default function PublicMapRedirectPage() {
  redirect("/citizen");
}
