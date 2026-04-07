import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
    const body = await req.json();
    console.log("Payload recibido:", JSON.stringify(body));

    const { chat_id, author_id, content } = body;

    // 1. Obtener el username del autor
    const { data: author } = await supabase
        .from("user_profile")
        .select("username")
        .eq("user_id", author_id)
        .single();

    const authorName = author?.username ?? "Alguien";
    console.log("Autor:", authorName);

    // 2. Obtener todos los miembros del chat excepto el autor
    const { data: members, error } = await supabase
        .from("chat_members")
        .select("FK_user_id")
        .eq("FK_chat_id", chat_id)
        .neq("FK_user_id", author_id);

    console.log("Miembros encontrados:", members?.length ?? 0, error ? "Error: " + error.message : "");

    if (error || !members || members.length === 0) {
        return new Response(JSON.stringify({ ok: false, reason: "No recipients" }), { status: 200 });
    }

    const userIds = members.map((m) => m.FK_user_id);

    // 3. Obtener los push_tokens de receptores con notificaciones activadas
    const { data: profiles } = await supabase
        .from("user_profile")
        .select("push_token")
        .in("user_id", userIds)
        .not("push_token", "is", null)
        .eq("notifications_enabled", true);

    const tokens = profiles?.map((p) => p.push_token).filter(Boolean) ?? [];
    console.log("Tokens encontrados:", tokens.length);

    if (tokens.length === 0) {
        return new Response(JSON.stringify({ ok: false, reason: "No tokens" }), { status: 200 });
    }

    // 4. Enviar a todos los receptores en batch
    const messages = tokens.map((token) => ({
        to: token,
        title: authorName,
        body: content,
        data: { room_id: chat_id },
        sound: "default",
    }));

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
    });

    const expoData = await expoRes.json();
    console.log("Respuesta de Expo:", JSON.stringify(expoData));

    return new Response(JSON.stringify({ ok: true, sent: tokens.length, expo: expoData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
});
