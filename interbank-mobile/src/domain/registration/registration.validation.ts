import { RegistrationStep } from "./registration.types";
import type {
  RegistrationDraft,
  RegistrationErrors,
} from "./registration.types";

// Local form validation only. Identity, account eligibility and uniqueness require the server.
export function validateRegistrationStep(
  step: RegistrationStep,
  draft: RegistrationDraft,
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (step === RegistrationStep.DOCUMENT) {
    if (!/^\d{8}$/.test(draft.documentNumber))
      errors.documentNumber = "Ingresa los 8 dígitos de tu DNI.";
    if (!draft.privacyAccepted)
      errors.privacyAccepted =
        "Lee y acepta la información de privacidad para continuar.";
  }
  if (step === RegistrationStep.CONTACT) {
    if (
      draft.email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())
    )
      errors.email = "Ingresa un correo electrónico válido.";
    if (!/^9\d{8}$/.test(draft.phone))
      errors.phone = "Ingresa tu número de celular de 9 dígitos.";
  }
  if (step === RegistrationStep.SECURITY) {
    if (!/^[a-zA-Z0-9]{6,20}$/.test(draft.username))
      errors.username = "Usa de 6 a 20 letras o números, sin espacios.";
    if (!getRegistrationPasswordChecks(draft).every((item) => item.met))
      errors.password = "Revisa los requisitos de tu contraseña.";
    if (!draft.confirmPassword || draft.confirmPassword !== draft.password)
      errors.confirmPassword = "Las contraseñas deben coincidir.";
  }
  return errors;
}

export function getRegistrationPasswordChecks(draft: RegistrationDraft) {
  return [
    {
      label: "Entre 8 y 128 caracteres",
      met: draft.password.length >= 8 && draft.password.length <= 128,
    },
    {
      label: "Incluye letras y números",
      met: /[a-zA-Z]/.test(draft.password) && /\d/.test(draft.password),
    },
    {
      label: "No contiene tu DNI ni es igual a tu usuario",
      met:
        draft.password.length > 0 &&
        (!draft.documentNumber ||
          !draft.password.includes(draft.documentNumber)) &&
        draft.password.toLowerCase() !== draft.username.toLowerCase(),
    },
  ];
}
