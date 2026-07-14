import { redirect } from "next/navigation";

export default function LegacyStudentsRedirect() {
  redirect("/admin/users");
}
