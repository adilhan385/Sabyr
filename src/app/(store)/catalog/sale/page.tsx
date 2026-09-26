import { redirect } from "next/navigation";

export default function CatalogSalePage() {
  redirect("/catalog?filter=sale");
}
