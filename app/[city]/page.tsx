import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ city: string }>;
}

export default async function CityPageRedirect({ params }: Props) {
  const { city } = await params;
  redirect(`/en/${city}`);
}
