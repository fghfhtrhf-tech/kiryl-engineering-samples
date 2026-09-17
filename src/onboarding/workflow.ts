import { normalizePhone, registrationSchema, type RegistrationInput } from "./schema.js";
import { withRetries, type PartnerClient } from "./partner.js";

export type OnboardResult = {
  applicationId: string;
  partnerDriverId: string;
  partnerVehicleId: string | null;
  phone: string;
};

export async function onboardApplicant(
  raw: unknown,
  partner: PartnerClient,
  createApplication: (payload: RegistrationInput) => Promise<string>
): Promise<OnboardResult> {
  const data = registrationSchema.parse(raw);
  const phone = normalizePhone(data.phone);
  const fullName = `${data.lastName} ${data.firstName}`.trim();
  const applicationId = await createApplication(data);

  if (data.track === "walking") {
    const driver = await withRetries(() =>
      partner.createWalkingProfile({ fullName, phone })
    );
    return {
      applicationId,
      partnerDriverId: driver.id,
      partnerVehicleId: null,
      phone
    };
  }

  const vehicle = await withRetries(() =>
    partner.createVehicle({ plate: data.plate, year: data.year, vin: data.vin || undefined })
  );
  const driver = await withRetries(() =>
    partner.createDriverProfile({ fullName, phone, vehicleId: vehicle.id })
  );
  try {
    await partner.bindVehicle(driver.id, vehicle.id);
  } catch {
    /* already bound via vehicleId */
  }

  return {
    applicationId,
    partnerDriverId: driver.id,
    partnerVehicleId: vehicle.id,
    phone
  };
}
