import z from "zod";

export const createGroupSchema = z.object({
    name: z.string().min(1, "El grupo debe tener al menos un caracter como nombre").trim(),
})
