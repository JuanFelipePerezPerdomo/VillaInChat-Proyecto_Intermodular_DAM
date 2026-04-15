import { Database } from "./database.types";

// Chat
export type Chat = Database['public']['Tables']['chat_room']['Row'];
export type ChatInsert = Database['public']['Tables']['chat_room']['Insert'];
export type ChatUpdate = Database['public']['Tables']['chat_room']['Update'];

// Chat Members
export type ChatMembers = Database['public']['Tables']['chat_members']['Row'];
export type ChatMemberInsert = Database['public']['Tables']['chat_members']['Insert'];
export type ChatMemberUpdate = Database['public']['Tables']['chat_members']['Update'];

// Messages
export type Messages = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// User
export type Users = Database['public']['Tables']['user_profile']['Row'];
export type UserInsert = Database['public']['Tables']['user_profile']['Insert'];
export type UserUpdate = Database['public']['Tables']['user_profile']['Update'];

//ENUMS
export type UserRole = Database['public']['Enums']['UserType'];
export type ChatPrivileges = Database['public']['Enums']['ChatPrivileges'];
export type ChatType = Database['public']['Enums']['ChatType'];

//Customs types y Relaciones

//Chat con sus miembros
export type ChatWithMembers = Chat & {
    members: ChatMembers[];
};

// Chat con miembros y sus datos de usuario
export type ChatWithMembersAndUsers = Chat & {
    members: (ChatMembers & {
        user: Users;
    })[];
};

// Mensajes con los datos del usuario que lo envio
export type MessageWithUser = Messages & {
    user: Users;
}

// ChatMember con datos del usuario
export type ChatMemberWithUser = ChatMembers & {
  user: Users;
};

// Chat completo (con miembros, usuarios y último mensaje)
export type ChatDetail = Chat & {
  members: (ChatMembers & {
    user: Users;
  })[];
  last_message?: Messages;
  unread_count?: number;
};

// types para formularios

// Para crear un chat nuevo
export type CreateChatData = {
  chat_type: ChatType;
  member_ids: string[];
};

// Para enviar un mensaje
export type SendMessageData = {
  chat_id: string;
  content: string;
};

// Para actualizar el perfil de usuario
export type UpdateProfileData = {
  username?: string;
  phone?: string;
  dni?: string;
  nie?: string;
};

// Mentions
export type Mention = Database['public']['Tables']['mentions']['Row'];
export type MentionInsert = Database['public']['Tables']['mentions']['Insert'];
export type MentionType = Database['public']['Enums']['MentionType'];

export type MentionWithDetails = Mention & {
    sender: { username: string }
    chat: { name: string | null }
    message: { content: string }
}

// Types no relacionados con la DB:
export { DEFAULT_SETTINGS } from "./settings";
export type { Settings, ThemeMode } from "./settings";
