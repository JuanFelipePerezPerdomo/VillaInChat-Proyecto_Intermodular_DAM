import z from "zod";

export const createRoomSchema = z.object({
    name: z.string().min(1, "El Chat debe tener al menos un caracter como nombre").trim(),
    isPublic: z.boolean(),
})