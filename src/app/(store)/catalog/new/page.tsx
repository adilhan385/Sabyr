import { redirect } from "next/navigation";

export default function CatalogNewPage() {
  redirect("/catalog?filter=new");
}
