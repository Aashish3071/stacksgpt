export function GET() {
  return Response.json(
    { error: "This legacy endpoint has been retired. Use the newsroom." },
    { status: 410 },
  );
}
export const POST = GET;
export const PATCH = GET;
export const DELETE = GET;
