// Kept separate from the "use server" actions file (which may only export
// async functions) so both the action and the form can share the type.
export type SetupState = {
  status: "idle" | "success" | "error";
  message?: string;
};
