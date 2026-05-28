export interface UserData {
  id: number;
  email: string;
  profile_name: string;
  db_name: string;
}

export type LoginBody = {
  email: string;
  password: string;
};

export type LoginFunc = (email: string, password: string) => Promise<UserData>;

export interface AuthContextType {
  user: UserData | null;
  login: LoginFunc;
  logout: () => void;
  loading: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
