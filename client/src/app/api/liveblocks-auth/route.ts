import { auth } from "@/lib/auth";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const { user } = await auth();

  // Identify the user and return the result
  const { status, body } = await liveblocks.identifyUser(
    {
      userId: user.userId,
      groupIds: ["7862ff3f-f728-4148-b0ce-81819d3041fc"],
    },
    { userInfo: user },
  );

  return new Response(body, { status });
}