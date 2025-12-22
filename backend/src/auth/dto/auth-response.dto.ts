export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    name: string;
    isGuest: boolean;
  };
}
