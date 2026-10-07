import { getCurrentUser } from "../auth/session";
import { getOrder, syncOrder } from "../orders";

/** `/api/orders/[id]/status`: what the order page polls while it waits. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.buyerId !== user.id) return new Response("not found", { status: 404 });

  return Response.json({ status: await syncOrder(order) });
}
