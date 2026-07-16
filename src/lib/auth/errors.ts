export class AuthorizationError extends Error {
  constructor(message = "Je hebt geen toegang tot deze actie.") {
    super(message);
    this.name = "AuthorizationError";
  }
}
