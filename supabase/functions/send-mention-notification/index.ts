import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

/**
 * Triggered by a DB webhook / pg_net trigger on INSERT into `mentions`.
 *
 * Payload (from the trigger): the new `mentions` row.
 *   type            "USER" | "EVERYONE"
 *   FK_recipent_id  string | null   (null = @everyone)
 *   FK_sender_id    string
 *   FK_chat_id      string
 *   FK_message_id   number
 */
Deno.serve(async (req) => {
    const payload = await req.json();
    console.log("send-mention-notification payload:", JSON.stringify(payload));

    // Supabase DB webhooks wrap the record under { type, table, record, ... }
    // pg_net triggers send the row directly. Handle both:
    const row = payload.record ?? payload;

    const { type, FK_recipent_id, FK_sender_id, FK_chat_id, FK_message_id } = row;

    if (!FK_sender_id || !FK_chat_id) {
        return json({ ok: false, reason: "Missing required fields" });
    }

    // 1. Fetch sender username + role
    const { data: sender } = await supabase
        .from("user_profile")
        .select("username, user_role")
        .eq("user_id", FK_sender_id)
        .single();

    const senderName = sender?.username ?? "Alguien";
    const senderRole = sender?.user_role ?? "STUDENT";

    // 2. Fetch chat name (for the notification body)
    const { data: chat } = await supabase
        .from("chat_room")
        .select("name")
        .eq("chat_id", FK_chat_id)
        .single();

    const chatName = chat?.name ?? "un chat";

    // 3. Determine recipient user IDs
    let recipientIds: string[] = [];

    if (type === "USER" && FK_recipent_id) {
        // Direct mention → only the mentioned user
        recipientIds = [FK_recipent_id];
    } else if (type === "EVERYONE") {
        // @everyone → all chat members except the sender
        const { data: members } = await supabase
            .from("chat_members")
            .select("FK_user_id")
            .eq("FK_chat_id", FK_chat_id)
            .neq("FK_user_id", FK_sender_id);

        recipientIds = (members ?? []).map((m) => m.FK_user_id);
    }

    if (recipientIds.length === 0) {
        return json({ ok: false, reason: "No recipients" });
    }

    // 4. Fetch push tokens of recipients who have notifications enabled
    const { data: profiles } = await supabase
        .from("user_profile")
        .select("push_token")
        .in("user_id", recipientIds)
        .not("push_token", "is", null)
        .eq("notifications_enabled", true);

    // Deduplicate tokens — same device may be registered under multiple accounts in testing
    const tokens = [...new Set(
        (profiles ?? []).map((p) => p.push_token).filter(Boolean) as string[]
    )];
    console.log("Tokens a notificar:", tokens.length);

    if (tokens.length === 0) {
        return json({ ok: false, reason: "No tokens" });
    }

    // 5. Build notification content
    const title = type === "EVERYONE"
        ? `${senderName} mencionó a todos`
        : `${senderName} te mencionó`;

    const body = `en #${chatName}`;

    // 6. Send via Expo Push API
    const messages = tokens.map((token) => ({
        to: token,
        title,
        body,
        data: {
            room_id: FK_chat_id,
            author_role: senderRole,
            mention_type: type,
        },
        sound: "default",
        priority: "high",
    }));

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
    });

    const expoData = await expoRes.json();
    console.log("Expo response:", JSON.stringify(expoData));

    return json({ ok: true, sent: tokens.length, expo: expoData });
});

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
