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
  is_public?: boolean;
  member_ids: string[]; // Array de user_ids para agregar como miembros
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