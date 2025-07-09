import { TUser } from "./types/types";

export type UserAwareness = {
  user?: TUser;
};

export type AwarenessList = [number, UserAwareness][];

declare global {
  interface Liveblocks {
    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string; // Accessible through `user.id`
      info: TUser; // Accessible through `user.info`
    };
  }
}
