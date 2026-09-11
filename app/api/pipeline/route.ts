export async function POST() {
  return Response.json(
    {
      error:
        "Article generation is handled by Antigravity. Submit a validated draft through /api/import/article.",
    },
    { status: 410 },
  );
}
